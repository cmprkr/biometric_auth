document.getElementById('registerButton').addEventListener('click', async () => {
    try {
        const publicKeyCredentialCreationOptions = {
            // WebAuthn public key creation options go here
            // This should include challenge, user information, relying party info, etc.
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        // Convert credential into a format that can be sent to the server
        // Send the credential to the server for registration
    } catch (err) {
        console.error(err);
    }
});

async function startRegistration() {
    // Fetch options from server
    const response = await fetch('/webauthn/register/start', { method: 'POST' });
    const options = await response.json();

    // Adjust options to match the expected format, if necessary

    // Call navigator.credentials.create() with those options
    const credential = await navigator.credentials.create({ publicKey: options });

    // Send the credential to the server for verification
    await fetch('/webauthn/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
    });

    // Handle server response
}
