import type { HandLandmark, GestureType, HandData } from '@/types';

function distance(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// 计算手掌是否正对屏幕
// 通过手指分布特征判断：正对屏幕时手指应该相对分散
function isPalmFacingCamera(landmarks: HandLandmark[]): boolean {
  const wrist = landmarks[0];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // 计算手腕到各指尖的距离
  const dIndex = distance(wrist, indexTip);
  const dMiddle = distance(wrist, middleTip);
  const dRing = distance(wrist, ringTip);
  const dPinky = distance(wrist, pinkyTip);

  // 计算平均距离
  const avgDist = (dIndex + dMiddle + dRing + dPinky) / 4;

  // 计算各指尖之间的距离（横向展开度）
  const spreadIndexMiddle = distance(indexTip, middleTip);
  const spreadMiddleRing = distance(middleTip, ringTip);
  const spreadRingPinky = distance(ringTip, pinkyTip);
  const totalSpread = spreadIndexMiddle + spreadMiddleRing + spreadRingPinky;

  // 正对屏幕时，手指横向展开度相对于手腕距离应该较大
  // 侧向时手指会重叠，展开度较小
  const spreadRatio = totalSpread / avgDist;

  // 展开度比例大于阈值认为是正对屏幕
  return spreadRatio > 0.6;
}

function isFingerExtended(
  tip: HandLandmark,
  pip: HandLandmark,
  mcp: HandLandmark,
  wrist: HandLandmark
): boolean {
  const tipToWrist = distance(tip, wrist);
  const pipToWrist = distance(pip, wrist);
  const mcpToWrist = distance(mcp, wrist);
  return tipToWrist > pipToWrist && pipToWrist > mcpToWrist && tipToWrist > mcpToWrist * 1.2;
}

export function classifySingleHandGesture(landmarks: HandLandmark[]): GestureType | null {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const ringMcp = landmarks[13];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const pinkyMcp = landmarks[17];

  const indexExt = isFingerExtended(indexTip, indexPip, indexMcp, wrist);
  const middleExt = isFingerExtended(middleTip, middlePip, middleMcp, wrist);
  const ringExt = isFingerExtended(ringTip, ringPip, ringMcp, wrist);
  const pinkyExt = isFingerExtended(pinkyTip, pinkyPip, pinkyMcp, wrist);

  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  // 张开手掌：4根手指都伸直，且手掌正对屏幕
  if (extendedCount === 4 && isPalmFacingCamera(landmarks)) return 'open_palm';

  // 比耶：食指和中指伸直，无名指和小指弯曲
  if (indexExt && middleExt && !ringExt && !pinkyExt) return 'peace_sign';

  return null;
}

// 检测双手比心手势
export function detectHeartHands(hands: HandData[]): boolean {
  if (hands.length !== 2) return false;

  const hand1 = hands[0];
  const hand2 = hands[1];

  // 获取每只手的食指和中指指尖
  const h1IndexTip = hand1.landmarks[8];
  const h1MiddleTip = hand1.landmarks[12];
  const h2IndexTip = hand2.landmarks[8];
  const h2MiddleTip = hand2.landmarks[12];

  // 计算指尖之间的距离
  const indexDist = distance(h1IndexTip, h2IndexTip);
  const middleDist = distance(h1MiddleTip, h2MiddleTip);
  const crossDist1 = distance(h1IndexTip, h2MiddleTip);
  const crossDist2 = distance(h1MiddleTip, h2IndexTip);

  // 手掌大小作为参考
  const palmSize1 = distance(hand1.landmarks[0], hand1.landmarks[9]);
  const palmSize2 = distance(hand2.landmarks[0], hand2.landmarks[9]);
  const avgPalmSize = (palmSize1 + palmSize2) / 2;

  // 比心条件：
  // 1. 食指和中指指尖靠近（形成心形顶部）
  // 2. 交叉距离适中（形成心形两侧）
  // 3. 手腕位置在指尖下方
  const tipsClose = indexDist < avgPalmSize * 0.8 && middleDist < avgPalmSize * 0.8;
  const formingHeart = crossDist1 < avgPalmSize * 1.5 && crossDist2 < avgPalmSize * 1.5;

  // 检查手腕是否在指尖下方（y坐标更大）
  const h1Wrist = hand1.landmarks[0];
  const h2Wrist = hand2.landmarks[0];
  const wristsBelow = h1Wrist.y > h1IndexTip.y && h2Wrist.y > h2IndexTip.y;

  return tipsClose && formingHeart && wristsBelow;
}

// 获取双手比心时的爱心发射位置（双手中间偏下的位置）
export function getHeartSpawnPosition(hands: HandData[]): { x: number; y: number } | null {
  if (hands.length !== 2) return null;

  const hand1 = hands[0];
  const hand2 = hands[1];

  // 获取手腕位置
  const h1Wrist = hand1.landmarks[0];
  const h2Wrist = hand2.landmarks[0];

  // 获取食指和中指指尖
  const h1Index = hand1.landmarks[8];
  const h1Middle = hand1.landmarks[12];
  const h2Index = hand2.landmarks[8];
  const h2Middle = hand2.landmarks[12];

  // 计算指尖中心（心形顶部）
  const tipsCenterX = (h1Index.x + h1Middle.x + h2Index.x + h2Middle.x) / 4;
  const tipsCenterY = (h1Index.y + h1Middle.y + h2Index.y + h2Middle.y) / 4;

  // 计算手腕中心（心形底部）
  const wristsCenterX = (h1Wrist.x + h2Wrist.x) / 2;
  const wristsCenterY = (h1Wrist.y + h2Wrist.y) / 2;

  // 爱心从双手中间偏下的位置（手腕和指尖之间，更靠近手腕）
  return {
    x: (tipsCenterX + wristsCenterX) / 2,
    y: (tipsCenterY + wristsCenterY * 2) / 3,
  };
}

export function getHandCenter(landmarks: HandLandmark[]): { x: number; y: number } {
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];

  return {
    x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
    y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3,
  };
}
