const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const filepath = path.join(__dirname,'..','..','docs','swagger.yaml');
const fs = require('fs');
const YAML = require('yaml');
const file  = fs.readFileSync(filepath, 'utf8');
const swaggerDocument = YAML.parse(file);
const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css';

router.use('/api-docs', swaggerUi.serve,swaggerUi.setup(swaggerDocument,  {
    customCss:
      '.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
    customCssUrl: CSS_URL,
}));
// router.get('/api-docs', swaggerUi.setup(swaggerDocument, options));

module.exports = router;
