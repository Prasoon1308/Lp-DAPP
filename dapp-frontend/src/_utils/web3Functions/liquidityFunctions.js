import { ethers, BigNumber } from "ethers";
import tokenABI from "../../../ABI/Token";
import {
  UniswapV2Router02,
  UniswapV2Factory,
} from "../contractAddresses";
import UniswapV2Router02ABI from "../../../ABI/UniswapV2Router";
import UniswapV2FactoryABI from "../../../ABI/UniswapV2Factory";
import UniswapV2PairABI from "../../../ABI/UniswapV2Pair";
import WETH9ABI from "../../../ABI/WETH9";


export function calculateSlippageAmount(amount, tolerancePercent) {
  let minAmount = amount * (1 - tolerancePercent / 100);
  let maxAmount = amount * (1 + tolerancePercent / 100);
  minAmount = isNaN(minAmount) ? 0 : minAmount;
  maxAmount = isNaN(maxAmount) ? 0 : maxAmount;
  return [minAmount.toFixed(10), maxAmount.toFixed(10)];
}

export const createPair = async (tokenA, tokenB, signer) => {
  const factoryContract = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    signer
  );

  try {
    const tx = await factoryContract.createPair(tokenA, tokenB);
    const receipt = await tx.wait();
    const pairCreatedEvent = receipt.events?.find(
      (event) => event.event === "PairCreated"
    );
    const pairAddress = pairCreatedEvent?.args?.pair;

    return pairAddress;
  } catch (error) {
    console.error("Error creating pair:", error);
    throw error;
  }
};

export const getPair = async (tokenA, tokenB, provider) => {
  const factoryContract = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    provider
  );

  try {
    const pairAddress = await factoryContract.getPair(tokenA, tokenB);
    return pairAddress;
  } catch (error) {
    console.error("Error getting pair:", error);
    throw error;
  }
};

export const calculateLiquidityOutput = async (
  tokenA,
  tokenB,
  amountADesired,
  signer
) => {
  const factoryContract = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    signer
  );
  const pairAddress = await factoryContract.getPair(tokenA, tokenB);
  const pairContract = new ethers.Contract(pairAddress, UniswapV2PairABI, signer);
  const reserves = await pairContract.getReserves();
  console.log(reserves._reserve0.toString())
  console.log(reserves._reserve1.toString())

  let reserveIn, reserveOut;
  if (tokenA < tokenB) {
    // [reserveIn, reserveOut] = [reserves[0], reserves[1]];
    [reserveIn, reserveOut] = [reserves._reserve0, reserves._reserve1];
  } else {
    // [reserveIn, reserveOut] = [reserves[1], reserves[0]];
    [reserveIn, reserveOut] = [reserves._reserve1, reserves._reserve0];
  }

  const formatedReserves0 = reserveIn.toString();
  const formatedReserves1 = reserveOut.toString();

  const formatedReserves0BN = ethers.BigNumber.from(formatedReserves0);
  const formatedReserves1BN = ethers.BigNumber.from(formatedReserves1);
  console.log(formatedReserves0)
  console.log(formatedReserves1)

  const amountADesiredBN = ethers.BigNumber.from(amountADesired);
  console.log(amountADesiredBN)

  if (formatedReserves0 == 0 && formatedReserves1 == 0) {
    return 0;
  } else {
    const result = formatedReserves1BN
      .mul(amountADesiredBN)
      .div(formatedReserves0BN);
      console.log(result.toString())
    return result.toString();
  }
};

export const calculateLiquidityShared = async (
  tokenA,
  tokenB,
  amountADesired,
  signer
) => {
  const factoryContract = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    signer
  );
  const pairAddress = await factoryContract.getPair(tokenA, tokenB);
  const pairContract = new ethers.Contract(pairAddress, UniswapV2PairABI, signer);
  const reserves = await pairContract.getReserves();

  let reserveIn, reserveOut;
  if (tokenA < tokenB) {
    // [reserveIn, reserveOut] = [reserves[0], reserves[1]];
    [reserveIn, reserveOut] = [reserves._reserve0, reserves._reserve1];
  } else {
    // [reserveIn, reserveOut] = [reserves[1], reserves[0]];
    [reserveIn, reserveOut] = [reserves._reserve1, reserves._reserve0];
  }

  const formatedReserves0 = reserveIn.toString();
  const formatedReserves1 = reserveOut.toString();

  const parsedEther = ethers.utils.parseEther(amountADesired);

  const formatedReserves0BN = ethers.BigNumber.from(formatedReserves0);
  const formatedReserves1BN = ethers.BigNumber.from(formatedReserves1);
  const amountADesiredBN = ethers.BigNumber.from(parsedEther);
  const precision = ethers.BigNumber.from("1000000000000000000"); // 18 decimal places
  const result = amountADesiredBN.mul(precision).div(formatedReserves0BN);
  const resultWithDecimals = ethers.utils.formatUnits(result, 16);

  // const result:  BigNumber = amountADesiredBN.mul(100).div(formatedReserves0BN);
  return resultWithDecimals.toString();
};

export async function addLiquidity(
  tokenA,
  tokenB,
  amountADesired,
  amountAMin,
  amountBMin,
  amountBMinBN,
  to,
  deadline,
  signer
) {
  const factoryContract = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    signer
  );
  const pairAddress = await factoryContract.getPair(tokenA, tokenB);
  const pairContract = new ethers.Contract(pairAddress, UniswapV2PairABI, signer);
  const amountADesiredBN = amountADesired;

  const routerContract = new ethers.Contract(
    UniswapV2Router02,
    UniswapV2Router02ABI,
    signer
  );

  // const amountAMinBN = amountAMin; // calculate slippage according to amountAMin
  // const amountBMinBigNumber = ethers.BigNumber.from(amountBMin); // calculate slippage according to amountBMin
  const deadlineBN = ethers.BigNumber.from(deadline);
  try {
    const tx = await routerContract.addLiquidity(
      tokenA,
      tokenB,
      amountADesiredBN,
      amountAMin,
      amountBMin,
      amountBMinBN,
      to,
      deadlineBN
    );
    
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    throw error;
  }
}

export async function addLiquidityETH(
  token,
  amountETH,
  amountTokenDesired,
  amountETHMin,
  amountTokenMin,
  to,
  deadline,
  signer
) {
  const factoryContract = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    signer
  );
  const pairAddress = await factoryContract.getPair(token, WETH9);
  const pairContract = new ethers.Contract(pairAddress, UniswapV2PairABI, signer);

  const routerContract = new ethers.Contract(
    UniswapV2Router02,
    UniswapV2Router02ABI,
    signer
  );
  // const amountETHMinBN = (amountETHMin / 10).toString();
  const deadlineBN = ethers.BigNumber.from(deadline);
  try {
    const tx = await routerContract.addLiquidityETH(
      token,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      to,
      deadlineBN,
      {
        value: amountETH,
      }
    );
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error adding pair:", error);
    throw error;
  }
}

export async function removeLiquidity(
  tokenA,
  tokenB,
  liquidityPerecenatge,
  to,
  deadline,
  signer
) {
  // need to optimise according to tokenA and tokenB
  const routerContract = new ethers.Contract(
    UniswapV2Router02,
    UniswapV2Router02ABI,
    signer
  );
  const deadlineBN = ethers.BigNumber.from(deadline);

  const tokenAContract = new ethers.Contract(tokenA, tokenABI, signer); // wethAddress
  const tokenBContract = new ethers.Contract(tokenB, tokenABI, signer);
  const factoryContract = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    signer
  );
  const pairAddress = await factoryContract.getPair(tokenA, tokenB); //wethaddress
  const pairContract = new ethers.Contract(pairAddress, UniswapV2PairABI, signer);

  const balanceA = await tokenAContract.balanceOf(pairAddress); //wethaddress
  const balanceB = await tokenBContract.balanceOf(pairAddress);
  const liquidity = await pairContract.balanceOf(to);
  // const removeLiquidityPer = liquidity.toString() * (liquidityPerecenatge / 100);
  const removeLiquidityPer = ethers.BigNumber.from(liquidity.toString())
    .mul(ethers.BigNumber.from(liquidityPerecenatge.toString()))
    .div(ethers.BigNumber.from("100"));
  const totalSupply = await pairContract.totalSupply();
  const amount0 = removeLiquidityPer.mul(balanceA).div(totalSupply); // divide by slippage Tolerance
  const amount1 = removeLiquidityPer.mul(balanceB).div(totalSupply); // divide by slippage Tolerance

  const [amount0S] = calculateSlippageAmount(amount0, 0.5);
  const [amount1S] = calculateSlippageAmount(amount1, 0.5);

  const owner = await signer.getAddress();
  const currentAllowance = await pairContract.allowance(
    owner,
    UniswapV2Router02
  );

  try {
    if (currentAllowance.lt(removeLiquidityPer)) {
      const allowance = await pairContract.approve(
        UniswapV2Router02,
        removeLiquidityPer
      );
      const allowed = await allowance.wait();
    }
    const tx = await routerContract.removeLiquidity(
      tokenA,
      tokenB,
      removeLiquidityPer,
      parseInt(amount0S).toString(),
      parseInt(amount1S).toString(),
      to,
      deadlineBN
    );
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error removing liquidity:", error);
    throw error;
  }
}

export async function removeLiquidityETH(
  tokenA,
  tokenB,
  liquidityPerecenatge,
  to,
  deadline,
  signer
) {
  // need to optimise according to tokenA and tokenB
  const routerContract = new ethers.Contract(
    UniswapV2Router02,
    UniswapV2Router02ABI,
    signer
  );
  const deadlineBN = ethers.BigNumber.from(deadline);

  const tokenAContract = new ethers.Contract(tokenA, WETH9ABI, signer); // wethAddress
  const tokenBContract = new ethers.Contract(tokenB, tokenABI, signer);
  const factoryContract = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    signer
  );
  const pairAddress = await factoryContract.getPair(tokenA, tokenB); //wethaddress
  const pairContract = new ethers.Contract(pairAddress, UniswapV2PairABI, signer);

  const balanceA = await tokenAContract.balanceOf(pairAddress);
  const balanceB = await tokenBContract.balanceOf(pairAddress);
  const liquidity = await pairContract.balanceOf(to);
  // const removeLiquidityPer = liquidity.toString() * (liquidityPerecenatge / 100);
  const removeLiquidityPer = ethers.BigNumber.from(liquidity.toString())
    .mul(ethers.BigNumber.from(liquidityPerecenatge.toString()))
    .div(ethers.BigNumber.from("100"));
  const totalSupply = await pairContract.totalSupply();
  const amount0 = removeLiquidityPer.mul(balanceA).div(totalSupply); // divide by slippage Tolerance
  const amount1 = removeLiquidityPer.mul(balanceB).div(totalSupply); // divide by slippage Tolerance

  const [amount0S] = calculateSlippageAmount(amount0, 0.5);
  const [amount1S] = calculateSlippageAmount(amount1, 0.5);

  const owner = await signer.getAddress();
  const currentAllowance = await pairContract.allowance(
    owner,
    UniswapV2Router02
  );

  try {
    if (currentAllowance.lt(removeLiquidityPer)) {
      const allowance = await pairContract.approve(
        UniswapV2Router02,
        removeLiquidityPer
      );
      const allowed = await allowance.wait();
    }
    const tx = await routerContract.removeLiquidityETH(
      tokenB,
      removeLiquidityPer,
      parseInt(amount1S).toString(),
      parseInt(amount0S).toString(),
      to,
      deadlineBN
    );
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error removing liquidity:", error);
    throw error;
  }
}
