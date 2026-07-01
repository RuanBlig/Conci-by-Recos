import dotenv from "dotenv";
dotenv.config();

const url = "https://jtagbcyaojevkbmrwgff.supabase.co";
console.log("Testing fetch directly to:", url);

async function testFetch() {
  try {
    const res = await fetch(url);
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response text:", text.slice(0, 100));
  } catch (err: any) {
    console.error("Direct fetch failed:", err);
    console.error("Error cause:", err.cause);
  }
}

testFetch();
