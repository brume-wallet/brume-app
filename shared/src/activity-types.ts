export interface ActivityIconDto {
  kind: "sol" | "token";
  mint?: string;
  logoUri: string | null;
}

export interface ActivityItemDto {
  signature: string;
  slot: number | null;
  err: string | null;
  blockTime: number | null;
  summary?: string;
  txType?: string | null;
  source?: string | null;
  displayLabel?: string;
  displayDetail?: string;
  activityIcons?: ActivityIconDto[];
}
