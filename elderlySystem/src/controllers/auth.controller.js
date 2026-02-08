exports.login = (req, res) => {
    // Your login logic here
    res.status(200).json({ message: 'Login successful' });
};

exports.register = (req, res) => {
    // Your registration logic here
    res.status(201).json({ message: 'Registration successful' });
};
