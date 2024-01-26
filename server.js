const {app,PORT} = require('./serverConfig');

app.listen(PORT, () => console.log('listening to port',PORT));
