import dns from "dns/promises"
export async function hasNetworkConnectivity(): Promise<boolean> {
  return await dns.lookup("www.example.com")
    .then(() => true)
    .catch(() => false)
}
