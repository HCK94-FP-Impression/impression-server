const { Cv, User } = require('../models')

class CvController {
    // Method validator, bukan endpoint
    static async validateCv(cv) {
        if (cv.experiences.length !== 0) {
            for (let i of cv.experiences) {
                if (!i?.title) throw {name: 'BadRequest', message: 'Title is required'};
                if (!i?.company) throw {name: 'BadRequest', message: 'Company is required'};
                if (!i?.startDate) throw {name: 'BadRequest', message: 'Start Date is required'};
                if (!i?.endDate || i?.endDate?.toLowerCase() === "present") i.endDate = "Present";
                const now = new Date((new Date()).toISOString().slice(0, 10))
                const start = new Date(i?.startDate)
                const end = i.endDate === "Present" ? now : new Date(i?.endDate)

                if (isNaN(start)) throw {name: 'BadRequest', message: 'Invalid experience start date'}
                if (isNaN(end)) throw {name: 'BadRequest', message: 'Invalid experience end date'}

                if (end - start < 0) throw {name: "BadRequest", message: "Experience end date cannot be more recent than start date"}
                if (start > now) throw {name: "BadRequest", message: "Experience start date cannot be more recent than current date"}
                i.startDate = (new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))).toISOString().slice(0, 10)
                i.endDate = i.endDate === "Present" ? "Present" : (new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()))).toISOString().slice(0, 10)
            }
        }

        if (cv.educations.length !== 0) {
            for (let i of cv.educations) {
                if (!i?.degree) throw {name: 'BadRequest', message: 'Degree is required'};
                if (!i?.institution) throw {name: 'BadRequest', message: 'Company is required'};
                if (!i?.startDate) throw {name: 'BadRequest', message: 'Start Date is required'};
                if (!i?.endDate || i?.endDate?.toLowerCase() === "present") i.endDate = "Present";
                if (!i?.gpa) throw {name: 'BadRequest', message: 'GPA is required'};
                const now = new Date((new Date()).toISOString().slice(0, 10))
                const start = new Date(i?.startDate)
                const end = i.endDate === "Present" ? now : new Date(i?.endDate)

                if (isNaN(start)) throw {name: 'BadRequest', message: 'Invalid education start date'}
                if (isNaN(end)) throw {name: 'BadRequest', message: 'Invalid education end date'}

                if (end - start < 0) throw {name: "BadRequest", message: "Education end date cannot be more recent than start date"}
                if (start > now) throw {name: "BadRequest", message: "Education start date cannot be more recent than current date"}
                i.startDate = (new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))).toISOString().slice(0, 10)
                i.endDate = i.endDate === "Present" ? "Present" : (new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()))).toISOString().slice(0, 10)
            }
        }

        if (cv.skills.length !== 0) {
            for (let i of cv.skills) {
                if (!i) throw {name: 'BadRequest', message: 'Skill name is required'}
            }
        }

        await cv.validate()
        return cv;
    }

    /* 
        POST - /cvs/add
        - Require Authentication (add cv ke akun pribadi)
        - Require 5 quotas
        - body: {
            experiences: [{
                title: String,
                company: String,
                startDate: Date,
                endDate: Date,
                description: String
            }, ...],
            educations: [{ 
                degree: String,
                institution: String,
                startDate: Date,
                endDate: Date,
                gpa: Number
            }, ...],
            skills: [ String, ...]
        },
        - response: {
            message: 'Create Cv Success!'
        }
        - All inputs optional, but each experience and education must have all fields filled.
    */
    static async createCv(req, res, next) {
        try {
            const { id: userId } = req.user
            const user = await User.findByPk(userId)
            if (!user) throw {name: 'NotFound', message: 'User not found'}
            if (user.quota < 5) throw {name: 'Forbidden', message: 'Not enough tokens to create CV'}

            const checkCv = {
                experiences: req?.body?.experiences || [], 
                educations: req?.body?.educations || [],
                skills: req?.body?.skills || [],
                userId
            }
            const cvInstance = await Cv.build(checkCv);
            const cv = await CvController.validateCv(cvInstance)
            await cv.save();
            await user.decrement('quota', {by: 5})
            await cv.reload();
            res.status(200).json({message: 'Create CV Success!'})
        } catch (error) {
            next(error)
        }
    }

    /* 
        PATCH - /cvs/edit
        - Require Authentication (edit cv akun pribadi)
        - Require 5 quotas
        - body: {
            experiences: [{
                title: String,
                company: String,
                startDate: Date,
                endDate: Date,
                description: String
            }, ...],
            educations: [{ 
                degree: String,
                institution: String,
                startDate: Date,
                endDate: Date,
                gpa: Number
            }, ...],
            skills: [ String, ...]
        }
        - response: {
            message: 'Update CV Success!'
        }
        - All inputs optional, but each experience and education must have all fields filled.
        - Replaces every included field in the body with the provided field. Ex. if the educations field is included, then the whole array of objects will be replaced.
    */
    static async updateCv(req, res, next) {
        try {
            const {id: userId} = req.user 
            const {experiences, educations, skills} = req.body

            const user = await User.findByPk(userId)
            if (!user) throw {name: 'NotFound', message: 'User not found'}
            if (user.quota < 5) throw {name: 'Forbidden', message: 'Not enough tokens to edit CV'}

            const currCv = await Cv.findOne({where: {userId}});
            if (!currCv) throw {name: 'NotFound', message: 'User CV not found!'};

            if (Array.isArray(experiences)) {
                currCv.experiences = experiences
            }

            if (Array.isArray(educations)) {
                currCv.educations = educations
            }

            if (Array.isArray(skills)) {
                currCv.skills = skills
            }

            await CvController.validateCv(currCv);
            currCv.updatedAt = (new Date()).toISOString()
            await currCv.save();
            await user.decrement('quota', {by: 5})
            await currCv.reload();
            res.status(200).json({message: 'Update CV Success!'})
        } catch (error) {
            next(error)
        }
    }

    /* 
        GET - /cvs/edit
        - Require Authentication (lihat cv akun pribadi)
        - response: {
            id: Number,
            userId: Number,
            experiences: [{
                title: String,
                company: String,
                startDate: Date,
                endDate: Date,
                description: String
            }, ...],
            educations: [{ 
                degree: String,
                institution: String,
                startDate: Date,
                endDate: Date,
                gpa: Number
            }, ...],
            skills: [ String, ...]
            createdAt: Date,
            updatedAt: Date
        }
        - All inputs optional, but each experience and education must have all fields filled.
        - Replaces every included field in the body with the provided field. Ex. if the educations field is included, then the whole array of objects will be replaced.
        */
    static async getCv(req, res, next) {
        try {
            const { id } = req.user 
            const cv = await Cv.findOne({
                where: { userId: id }
            })
            if (!cv) throw {name: 'NotFound', message: 'CV not found'}

            res.status(200).json(cv)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = CvController