async function main() {
  const url = 'https://insure-crm-backend-1-n420.onrender.com/api/insCompany?companyId=68ca95091d6a9cc2b96ae263';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ insCompany: 'Test Insurance Company' })
    });
    const json = await res.json();
    console.log("Response status:", res.status);
    console.log("Response data:", json);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
