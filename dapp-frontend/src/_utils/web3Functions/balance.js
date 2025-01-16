import { ethers } from "ethers";
import tokenABI from "../../../ABI/Token";
import { UniswapV2Router02, UniswapV2Factory } from "../contractAddresses";
import UniswapV2RouterABI from "../../../ABI/UniswapV2Router";
import UniswapV2FactoryABI from "../../../ABI/UniswapV2Factory";
import UniswapV2PairABI from "../../../ABI/UniswapV2Pair";

export function calculateSlippageAmount(amount, tolerancePercent) {
  let minAmount = amount * (1 - tolerancePercent / 100);
  let maxAmount = amount * (1 + tolerancePercent / 100);
  minAmount = isNaN(minAmount) ? 0 : minAmount;
  maxAmount = isNaN(maxAmount) ? 0 : maxAmount;
  return [minAmount.toFixed(10), maxAmount.toFixed(10)];
}

export const getBalance = async (tokenAddress, walletAddress, provider) => {
  const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
  const balance = await contract.balanceOf(walletAddress);
  // const formatedBalance = ethers.utils.formatEther(balance);
  // const floatBalance = parseFloat(formatedBalance);
  // const truncatedBalance = Math.floor(floatBalance * 10000) / 10000;
  return balance;
};

export const ETHEREUMBalance = async (walletAddress, provider) => {
  const balance = await provider.getBalance(walletAddress);
  const formatedBalance = ethers.utils.formatEther(balance);
  const floatBalance = parseFloat(formatedBalance);
  const truncatedBalance = Math.floor(floatBalance * 10000) / 10000;
  return truncatedBalance.toFixed(4);
};

export const checkAllowance = async (
  tokenAddress,
  amount,
  provider,
  signer
) => {
  const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
  const contractWithSigner = contract.connect(signer);

  try {
    const owner = await signer.getAddress();
    const currentAllowance = await contract.allowance(owner, UniswapV2Router02);
    console.log("currentAllowance", currentAllowance.toString());

    if (currentAllowance.lt(amount)) {
      try {
        const approveTx = await contractWithSigner.approve(
          UniswapV2Router02,
          amount
        );
        await approveTx.wait();
        return approveTx;
      } catch (approveError) {
        throw approveError;
      }
    }
  } catch (error) {
    throw error;
  }
};

const checkTokenAddresses = [
  "0xb4102C0985d94DE1Ae48fE6530e7cCB2228c30Fa",
  "0x599B9bD208FbA7077c3f87e58B89f95AE8d64eE3",
];

export const getPairAddress = async (token1, token2, provider) => {
  const factory = new ethers.Contract(
    UniswapV2Factory,
    UniswapV2FactoryABI,
    provider
  );
  const pairAddress = await factory.getPair(token1, token2);
  return pairAddress;
};

export const getSwapOutput = async (token1, token2, amount, signer) => {
  try {
    const factoryContract = new ethers.Contract(
      UniswapV2Factory,
      UniswapV2FactoryABI,
      signer
    );
    console.log("factoryContract", factoryContract);

    let pairAddress = await factoryContract.getPair(token1, token2);
    console.log("pairAddress", pairAddress);
    if (pairAddress !== ethers.constants.AddressZero) {
      const pairContract = new ethers.Contract(
        pairAddress,
        UniswapV2PairABI,
        signer
      );
      console.log("pairContract", pairContract);
      const reserves = await pairContract.getReserves();

      let reserveIn, reserveOut;
      if (token1 < token2) {
        [reserveIn, reserveOut] = [reserves._reserve0, reserves._reserve1];
      } else {
        [reserveIn, reserveOut] = [reserves._reserve1, reserves._reserve0];
      }

      console.log("reserveIn", reserveIn.toString());
      console.log("reserveOut", reserveOut.toString());
      // Calculate amount out based on x * y = k formula
      // const amountIn = ethers.BigNumber.from(amount); // take the amount IN value here
      let amountIn = ethers.utils.parseUnits(`${amount}`, "ether");
      // const amountIn = ethers.BigNumber.from(weiValue); // take the amount IN value here
      const amountInWithFee = amountIn.mul(997); // 0.3% fee
      const numerator = amountInWithFee.mul(reserveOut);
      const denominator = reserveIn.mul(1000).add(amountInWithFee);
      let result;
      if (denominator <= 0) {
        result = "0";
        throw new Error("Insufficient liquidity");
      } else {
        const amountOut = numerator.div(denominator);
        result = ethers.utils.formatEther(amountOut);
        return parseFloat(result).toFixed(5);
      }
    }
    // Would be easier if subgraph integrated
    // else {
    //   const data = await getPathAddress(
    //     token1.toLowerCase(),
    //     token2.toLowerCase(),
    //     signer
    //   );
    //   if (data && data?.data.length < 3) {
    //     throw new Error("Insufficient liquidity");
    //   } else {
    //     // if data not exist show error insufficient liquiidi
    //     const contract = new ethers.Contract(
    //       UniswapV2Router02,
    //       UniswapV2RouterABI,
    //       signer
    //     );
    //     let amountIn = ethers.utils.parseUnits(`${amount}`, "ether");
    //     if (amountIn.toString() !== "0") {
    //       const amountsOut = await contract.getAmountsOut(amountIn, data?.data);
    //       let result = ethers.utils.formatEther(amountsOut[2].toString());
    //       if (parseFloat(result).toFixed(5) === "0") {
    //         throw new Error("Insufficient liquidity");
    //       } else {
    //         return parseFloat(result).toFixed(5);
    //       }
    //     }
    //   }
    // }
  } catch (error) {
    console.log("calculate swap output", error);
    throw error;
  }
};

export const swapExactTokensForTokens = async (
  amountIn,
  amountOutMin,
  tokensAddress,
  walletAddress,
  deadline,
  signer,
  toleranceValue
) => {
  try {
    const factoryContract = new ethers.Contract(
      UniswapV2Factory,
      UniswapV2FactoryABI,
      signer
    );
    const pairAddress = await factoryContract.getPair(
      tokensAddress[0],
      tokensAddress[1]
    );
    const contract = new ethers.Contract(
      UniswapV2Router02,
      UniswapV2RouterABI,
      signer
    );
    let amountInWei = ethers.utils.parseUnits(`${amountIn}`, "ether");
    const [amount0S] = calculateSlippageAmount(amountOutMin, toleranceValue);
    console.log("amount0S", amount0S);
    let amountOutMinInWei = ethers.utils.parseUnits(`${amount0S}`, "ether");
    console.log("amountOutMinInWei", amountOutMinInWei.toString());

    const swap = await contract.swapExactTokensForTokens(
      amountInWei,
      amountOutMinInWei,
      tokensAddress,
      walletAddress,
      deadline
    );
    await swap.wait();
    return swap;
  } catch (error) {
    throw error;
  }
};

// export const calculateSwapInput = async (toleranceValue, token1, token2, signer, amount) => {
//   try {
//     const factoryContract = new ethers.Contract(UniswapV2Factory, UniswapV2FactoryABI, signer);
//     const pairAddress = await factoryContract.getPair(token1, token2);
//     const pairContract = new ethers.Contract(pairAddress, PairABI, signer);
//     if (pairAddress !== ethers.constants.AddressZero) {
//       const reserves = await pairContract.getReserves();

//       let reserveIn, reserveOut;
//       if (token1 < token2) {
//         [reserveIn, reserveOut] = [reserves._reserve0, reserves._reserve1];
//       } else {
//         [reserveIn, reserveOut] = [reserves._reserve1, reserves._reserve0];
//       }

//       // Calculate amount out based on x * y = k formula
//       // const amountOut = ethers.BigNumber.from(amount); // take the amount Out value here
//       let amountOut = ethers.utils.parseUnits(`${amount}`, 'ether');
//       // const amountOut = ethers.BigNumber.from(weiValue); // take the amount Out value here
//       const numerator = reserveIn.mul(amountOut).mul(1000);
//       const denominator = reserveOut.sub(amountOut).mul(997);
//       let result;
//       if (denominator <= 0) {
//         result = '0';
//         throw new Error('Insufficient liquidity');
//       } else {
//         const amountIn = numerator.div(denominator).add(1);
//         result = ethers.utils.formatEther(amountIn);
//         return parseFloat(result).toFixed(5);
//       }
//     } else {
//       const data = await getPathAddress(token1.toLowerCase(), token2.toLowerCase(), signer);
//       if (data && data?.data.length < 3) {
//         throw new Error('Insufficient liquidity');
//       } else {
//         const contract = new ethers.Contract(UniswapV2Router02, UniswapV2Router, signer);
//         let amountOut = ethers.utils.parseUnits(`${amount}`, 'ether');
//         if (amountOut.toString() !== '0') {
//           const amountsIn = await contract.getAmountsIn(amountOut, data?.data);
//           let result = ethers.utils.formatEther(amountsIn[0].toString());
//           if (parseFloat(result).toFixed(5) === '0') {
//             throw new Error('Insufficient liquidity');
//           } else {
//             return parseFloat(result).toFixed(5);
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Error calculating swap output:', error);
//     throw error;
//   }
// };

// export const swapTokensForExactTokens = async (
//   amountInMax,
//   amountOut,
//   tokensAddress,
//   walletAddress,
//   deadline,
//   signer,
//   toleranceValue,
// ) => {
//   try {
//     const factoryContract = new ethers.Contract(UniswapV2Factory, UniswapV2FactoryABI, signer);
//     const pairAddress = await factoryContract.getPair(tokensAddress[0], tokensAddress[1]);
//     const contract = new ethers.Contract(UniswapV2Router02, UniswapV2Router, signer);

//     // const contractWithSigner = contract.connect(signer);
//     let amountOutWei = ethers.utils.parseUnits(`${amountOut}`, 'ether');
//     const [, amount1S] = calculateSlippageAmount(amountInMax, toleranceValue);
//     let amountInMaxWei = ethers.utils.parseUnits(`${amount1S}`, 'ether');
//     if (pairAddress === ethers.constants.AddressZero) {
//       let data = await getPathAddress(tokensAddress[0].toLowerCase(), tokensAddress[1].toLowerCase(), signer);
//       const swap = await contract.swapTokensForExactTokens(amountOutWei, amountInMaxWei, data?.data, walletAddress, deadline);
//       const swapped = await swap.wait();
//       return swapped;
//     } else {
//       const swap = await contract.swapTokensForExactTokens(amountOutWei, amountInMaxWei, tokensAddress, walletAddress, deadline);
//       const swapped = await swap.wait();
//       return swapped;
//     }
//   } catch (error) {
//     throw error;
//   }
// };

// export const swapExactETHForTokens = async (amountOutMin: any, amount: any, tokensAddress: any, walletAddress: any, deadline: any, signer: any, toleranceValue: any) => {
//   try {
//     const contract = new ethers.Contract(UniswapV2Router02, UniswapV2Router, signer);
//     const [amount0S] = calculateSlippageAmount(amountOutMin, toleranceValue);
//     let amountOutInWei = ethers.utils.parseUnits(`${amount0S}`, 'ether');
//     // let amountIn = ethers.utils.parseUnits(`${amount}`, 'ether');
//     const factoryContract = new ethers.Contract(UniswapV2Factory, UniswapV2FactoryABI, signer);
//     const pairAddress = await factoryContract.getPair(tokensAddress[0], tokensAddress[1]);
//     if (pairAddress === ethers.constants.AddressZero) {
//       let data = await getPathAddress(tokensAddress[0].toLowerCase(), tokensAddress[1].toLowerCase(), signer);
//       const swap = await contract.swapExactETHForTokens(amountOutInWei, data?.data, walletAddress, deadline, { value: amount });
//       const swapped = await swap.wait();
//       return swapped;
//     } else {
//       const swap = await contract.swapExactETHForTokens(amountOutInWei, tokensAddress, walletAddress, deadline, { value: amount });
//       const swapped = await swap.wait();
//       return swapped;
//     }
//   } catch (error) {
//     throw error;
//   }
// };

// export const swapTokensForExactETH = async (
//   amountOut: any,
//   amountInMax: any,
//   tokensAddress: any,
//   walletAddress: any,
//   deadline: any,
//   signer: any,
//   toleranceValue: any,
// ) => {
//   try {
//     const contract = new ethers.Contract(UniswapV2Router02, UniswapV2RouterABI, signer);
//     let amountOutWei = ethers.utils.parseUnits(`${amountOut}`, 'ether');
//     const [, amount1S] = calculateSlippageAmount(amountInMax, toleranceValue);
//     let amountInMaxWei = ethers.utils.parseUnits(`${amount1S}`, 'ether');
//     const factoryContract = new ethers.Contract(UniswapV2Factory, UniswapV2FactoryABI, signer);
//     const pairAddress = await factoryContract.getPair(tokensAddress[0], tokensAddress[1]);
//     if (pairAddress === ethers.constants.AddressZero) {
//       let data = await getPathAddress(tokensAddress[0].toLowerCase(), tokensAddress[1].toLowerCase(), signer);
//       const swap = await contract.swapTokensForExactETH(amountOutWei, amountInMaxWei, data?.data, walletAddress, deadline);
//       const swapped = await swap.wait();
//       return swapped;
//     } else {
//       const swap = await contract.swapTokensForExactETH(amountOutWei, amountInMaxWei, tokensAddress, walletAddress, deadline);
//       const swapped = await swap.wait();
//       return swapped;
//     }
//   } catch (error) {
//     throw error;
//   }
// };

// export const swapExactTokensForETH = async (
//   amountIn: any,
//   amountOutMax: any,
//   tokensAddress: any,
//   walletAddress: any,
//   deadline: any,
//   signer: any,
//   toleranceValue: any,
// ) => {
//   try {
//     const contract = new ethers.Contract(UniswapV2Router02, UniswapV2RouterABI, signer);
//     let amountInWei = ethers.utils.parseUnits(`${amountIn}`, 'ether');
//     const [amount0S] = calculateSlippageAmount(amountOutMax, toleranceValue);
//     let amountOutMaxWei = ethers.utils.parseUnits(`${amount0S}`, 'ether');
//     const factoryContract = new ethers.Contract(UniswapV2Factory, UniswapV2FactoryABI, signer);
//     const pairAddress = await factoryContract.getPair(tokensAddress[0], tokensAddress[1]);
//     if (pairAddress === ethers.constants.AddressZero) {
//       let data = await getPathAddress(tokensAddress[0].toLowerCase(), tokensAddress[1].toLowerCase(), signer);
//       const swap = await contract.swapExactTokensForETH(amountInWei, amountOutMaxWei, data?.data, walletAddress, deadline);
//       const swapped = await swap.wait();
//       return swapped;
//     } else {
//       const swap = await contract.swapExactTokensForETH(amountInWei, amountOutMaxWei, tokensAddress, walletAddress, deadline);
//       const swapped = await swap.wait();
//       return swapped;
//     }
//   } catch (error) {
//     throw error;
//   }
// };

// export const swapETHForExactTokens = async (amountOutMin: any, amount: any, tokensAddress: any, walletAddress: any, deadline: any, signer: any, toleranceValue: any) => {
//   try {
//     const contract = new ethers.Contract(UniswapV2Router02, UniswapV2RouterABI, signer);
//     let amountOutMinWei = ethers.utils.parseUnits(`${amountOutMin}`, 'ether');
//     const [, amount1S] = calculateSlippageAmount(amount, toleranceValue);
//     let amountWei = ethers.utils.parseUnits(`${amount1S}`, 'ether');
//     const factoryContract = new ethers.Contract(UniswapV2Factory, UniswapV2FactoryABI, signer);
//     const pairAddress = await factoryContract.getPair(tokensAddress[0], tokensAddress[1]);
//     if (pairAddress === ethers.constants.AddressZero) {
//       let data = await getPathAddress(tokensAddress[0].toLowerCase(), tokensAddress[1].toLowerCase(), signer);
//       const swap = await contract.swapETHForExactTokens(amountOutMinWei, data?.data, walletAddress, deadline, { value: amountWei });
//       const swapped = await swap.wait();
//       return swapped;
//     } else {
//       const swap = await contract.swapETHForExactTokens(amountOutMinWei, tokensAddress, walletAddress, deadline, { value: amountWei });
//       const swapped = await swap.wait();
//       return swapped;
//     }
//   } catch (error) {
//     throw error;
//   }
// };
