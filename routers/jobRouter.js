const JobController = require('../controllers/jobController')
const authentication = require('../middlewares/authentication')

const jobRouter = require('express').Router()

jobRouter.get('/', authentication, JobController.getRecommendations)

module.exports = jobRouter