const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const filepath = path.join(__dirname,'..','..','docs','swagger.yaml');
const fs = require('fs');
const YAML = require('yaml');
const file  = fs.readFileSync(filepath, 'utf8');
const swaggerDocument = YAML.parse(file);

const options = {
    customCss: '.swagger-ui .topbar { display: none }'
};

router.use('/api-docs', swaggerUi.serve,swaggerUi.setup(swaggerDocument, options));
// router.get('/api-docs', swaggerUi.setup(swaggerDocument, options));

module.exports = router;
