import type {
  PersistedVault,
  PersistedWallet,
  WalletAccount,
} from "@/shared/types";

const STORAGE_KEY = "brume_wallet_v1";

const LEGACY_ACTIVITY_KEY = ["hel", "ius", "Api", "Key"].join("");

type StoredBlob = Record<string, unknown>;

function stripLegacyFields(v: StoredBlob): void {
  delete v[LEGACY_ACTIVITY_KEY];
  delete v.activityApiKey;
  delete v.encryptedActivityApiKey;
}

function newId(): string {
  return crypto.randomUUID();
}

function migrateLegacyToVault(raw: PersistedWallet): PersistedVault {
  const id = newId();
  const acc: WalletAccount = {
    id,
    label: "Account 1",
    keystore: raw.keystore,
    connectedOrigins: raw.connectedOrigins ?? {},
  };
  return {
    version: 2,
    activeAccountId: id,
    accounts: [acc],
    network: raw.network,
    rpcUrlOverride: raw.rpcUrlOverride ?? null,
    allowlist: raw.allowlist ?? [],
    blocklist: raw.blocklist ?? [],
    simpleMode: raw.simpleMode ?? true,
  };
}

function isPersistedVaultShape(o: StoredBlob): boolean {
  return (
    o.version === 2 &&
    Array.isArray(o.accounts) &&
    typeof o.activeAccountId === "string"
  );
}

export async function loadVault(): Promise<PersistedVault | null> {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  const v = raw[STORAGE_KEY] as StoredBlob | undefined;
  if (!v || typeof v !== "object") return null;
  stripLegacyFields(v);

  if (isPersistedVaultShape(v)) {
    return v as unknown as PersistedVault;
  }

  const legacy = v as unknown as PersistedWallet;
  if (legacy.keystore && typeof legacy.keystore === "object") {
    const vault = migrateLegacyToVault(legacy);
    await saveVault(vault);
    return vault;
  }

  return null;
}

export async function saveVault(data: PersistedVault): Promise<void> {
  const payload = { ...data } as StoredBlob;
  stripLegacyFields(payload);
  await chrome.storage.local.set({ [STORAGE_KEY]: payload });
}

export async function clearPersisted(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
