import fetch from "node-fetch"; // if using Node 18+, you can use global fetch

async function run() {
  const res = await fetch("http://localhost:5000/api/auth/verify-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@mentorship.com",
      password: "admin123"
    })
  });

  const data = await res.json();
  console.log(data);
}

run();
