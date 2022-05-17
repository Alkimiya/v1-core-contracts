const calculateHaircut = function ({ base, day, period }) {
  return 1 - base * ((day - 1) / period) ** 3;
};

const calculateUnsoldCollateralRefund = function ({
  collateralBalance,
  hashrateSold,
  totalHashrate,
}) {
  if (hashrateSold === totalHashrate) {
    return collateralBalance;
  }
  return collateralBalance - (collateralBalance * hashrateSold) / totalHashrate;
};

const toBigNumberStr = ({ str, decimals }) => {
  if (!str) return "0";
  if (typeof str !== "string") str = str.toString();
  str = str.replace(/[^.\d]/g, "");
  if (!str) return "0";
  const valueArray = str.split(".");
  const decimalValue = (
    valueArray[1] ? valueArray[1].slice(0, decimals) : ""
  ).padEnd(decimals, "0");
  const bigNumberStr = (
    (valueArray[0] ? valueArray[0] : "") + decimalValue
  ).replace(/^0+/, "");
  return bigNumberStr ? bigNumberStr : "0";
};

module.exports = {
  calculateHaircut,
  calculateUnsoldCollateralRefund,
  toBigNumberStr,
};
