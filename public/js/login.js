async function startLogin() {
    // Fetch options from server
    const response = await fetch('/webauthn/login/start', { method: 'POST' });
    const options = await response.json();

    // Adjust options to match the expected format, if necessary

    // Call navigator.credentials.get() with those options
    const assertion = await navigator.credentials.get({ publicKey: options });

    // Send the assertion to the server for verification
    await fetch('/webauthn/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertion),
    });

    // Handle server response
}
