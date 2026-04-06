const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@giggty.com',
      password: 'password123'
    });
    console.log('Login success:', res.data.user.email);
  } catch (err) {
    if (err.response) {
      console.error('Login failed with status:', err.response.status);
      console.error('Error data:', JSON.stringify(err.response.data));
    } else {
      console.error('Login error (no response):', err.message);
    }
  }
}

test();
