import axios from 'axios';

async function testJson() {
  try {
    const res = await axios.post('https://delivery-routing-system.onrender.com/user/Login', {
      username: 'testuser123',
      password: 'Password123!'
    });
    console.log('JSON Success', res.data);
  } catch (err) {
    console.error('JSON Error:', err.response?.data);
  }
}

async function testForm() {
  try {
    const params = new URLSearchParams();
    params.append('username', 'testuser123');
    params.append('password', 'Password123!');
    const res = await axios.post('https://delivery-routing-system.onrender.com/user/Login', params);
    console.log('Form Success', res.data);
  } catch (err) {
    console.error('Form Error:', err.response?.data);
  }
}

async function run() {
  await testJson();
  await testForm();
}
run();
