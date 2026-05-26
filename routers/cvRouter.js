const CvController = require('../controllers/cvController')
const authentication = require('../middlewares/authentication')

const cvRouter = require('express').Router()

cvRouter.get('/', authentication, CvController.getCv)
cvRouter.post('/add', authentication, CvController.createCv)
cvRouter.patch('/edit', authentication, CvController.updateCv)

module.exports = cvRouter;