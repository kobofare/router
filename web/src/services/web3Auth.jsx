import * as web3bs from '@yeying-community/web3-bs';

import { WEB3_AUTH_OPTIONS, WEB3_TOKEN_STORAGE_KEY } from '../helpers/web3';

const WALLET_RECONNECT_TIMEOUT_MS = 1600;

const isUserRejectedWalletAction = (error) => {
  if (typeof web3bs.isUserRejectedWalletAction === 'function') {
    return web3bs.isUserRejectedWalletAction(error);
  }
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 4001 || message.includes('user rejected');
};

const isWalletReconnectError = (error) => {
  if (typeof web3bs.isWalletReconnectError === 'function') {
    return web3bs.isWalletReconnectError(error);
  }
  const message = String(error?.message || '').toLowerCase();
  const reason = String(error?.data?.reason || '').toLowerCase();
  return (
    error?.code === 4900 ||
    reason.includes('extension_context_invalidated') ||
    message.includes('extension context invalidated') ||
    message.includes('wallet extension reconnected') ||
    message.includes('wallet not connected') ||
    message.includes('please refresh the page') ||
    message.includes('provider disconnected') ||
    message.includes('timeout')
  );
};

const watchWalletProvider = (handler, options) => {
  if (typeof web3bs.watchProvider === 'function') {
    return web3bs.watchProvider(handler, options);
  }
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    handler({ provider: window.ethereum || null, present: Boolean(window.ethereum) });
  };
  window.addEventListener('ethereum#initialized', finish, { once: true });
  window.addEventListener('eip6963:announceProvider', finish, { once: true });
  try {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  } catch (error) {
    // Ignore unsupported discovery events.
  }
  return () => {
    window.removeEventListener('ethereum#initialized', finish);
    window.removeEventListener('eip6963:announceProvider', finish);
  };
};

export function normalizeChainId(chainId) {
  if (!chainId) return '';
  if (typeof chainId !== 'string') return String(chainId);
  if (chainId.startsWith('0x')) {
    const parsed = parseInt(chainId, 16);
    if (!Number.isNaN(parsed)) {
      return parsed.toString();
    }
  }
  return chainId;
}

function waitForWalletProviderReconnect(timeoutMs = WALLET_RECONNECT_TIMEOUT_MS) {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    let stopWatching = () => {};
    const finish = () => {
      if (settled) return;
      settled = true;
      stopWatching();
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    stopWatching = watchWalletProvider(
      ({ present }) => {
        if (present) {
          finish();
        }
      },
      { preferYeYing: true, pollIntervalMs: 100, maxPolls: 16 },
    );
    if (settled) {
      stopWatching();
    }
  });
}

export async function requireWalletProvider() {
  const provider = await web3bs.getProvider();
  if (!provider) {
    throw new Error('未检测到钱包，请安装 MetaMask 或开启浏览器钱包');
  }
  return provider;
}

export async function getWalletContext() {
  const provider = await requireWalletProvider();
  const accounts = await web3bs.requestAccounts({ provider });
  const address = accounts?.[0];
  if (!address) {
    throw new Error('未获取到钱包账户');
  }
  const chainId = normalizeChainId(await web3bs.getChainId(provider));
  return { provider, address, chainId };
}

async function loginWithWalletOnce() {
  const { provider, address } = await getWalletContext();
  const loginResult = await web3bs.loginWithChallenge({
    provider,
    address,
    ...WEB3_AUTH_OPTIONS,
  });
  return { ...loginResult, provider, address };
}

export async function loginWithWallet() {
  try {
    return await loginWithWalletOnce();
  } catch (error) {
    if (!isWalletReconnectError(error) || isUserRejectedWalletAction(error)) {
      throw error;
    }
    await waitForWalletProviderReconnect();
    return await loginWithWalletOnce();
  }
}

export function isWalletUserRejectedError(error) {
  return isUserRejectedWalletAction(error);
}

export async function signWalletMessage(message, address, provider) {
  const activeProvider = provider || (await requireWalletProvider());
  const signature = await web3bs.signMessage({
    provider: activeProvider,
    message,
    address,
  });
  return { signature, provider: activeProvider };
}

export function getStoredAccessToken() {
  return web3bs.getAccessToken({ tokenStorageKey: WEB3_TOKEN_STORAGE_KEY });
}

export async function refreshWalletAccessToken() {
  return web3bs.refreshAccessToken(WEB3_AUTH_OPTIONS);
}

export async function logoutWallet() {
  try {
    await web3bs.logout(WEB3_AUTH_OPTIONS);
  } finally {
    web3bs.clearAccessToken({ tokenStorageKey: WEB3_TOKEN_STORAGE_KEY });
  }
}
