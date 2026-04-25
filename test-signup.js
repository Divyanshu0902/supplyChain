import axios from 'axios';

async function testRole(roleToTest, id) {
  try {
    await axios.post('https://delivery-routing-system.onrender.com/user/Signup/', {
      username: 'testuser' + id,
      password: 'Password123!',
      email: 'test' + id + '@example.com',
      role: roleToTest,
      work_location: 'City Hub',
      address: '123 Main St'
    });
    console.log('Success for role:', roleToTest);
  } catch (err) {
    console.error('Error for role', roleToTest, ':', err.response?.data);
  }
}
async function run() {
  await testRole('Deliveryman', Date.now() + 1);
  await testRole('Warehouse employee', Date.now() + 2);
  await testRole('admin', Date.now() + 3);
}
run();
