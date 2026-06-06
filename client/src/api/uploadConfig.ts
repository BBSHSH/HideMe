const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

let cachedUploadBaseURL: string | null = null;
let cacheReady = false;

// サーバーからアップロード設定を取得し、アップロード先のベース URL を返す
// use_direct_url=true かつ upload_url が設定されていればそちらを使う
export async function getUploadBaseURL(): Promise<string> {
  if (cacheReady && cachedUploadBaseURL !== null) return cachedUploadBaseURL;

  try {
    const res = await fetch(`${BASE_URL}/v1/upload-config`);
    if (res.ok) {
      const data = await res.json();
      if (data.use_direct_url && data.upload_url) {
        cachedUploadBaseURL = data.upload_url as string;
        cacheReady = true;
        return cachedUploadBaseURL;
      }
    }
  } catch {
    // フォールバック
  }

  cachedUploadBaseURL = BASE_URL;
  cacheReady = true;
  return BASE_URL;
}
