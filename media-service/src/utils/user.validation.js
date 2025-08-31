import Joi from 'joi';

const validateNewMediaData = (data) => {
    const schema = Joi.object({
        originalName: Joi.string().min(3).max(30).required(),
        url: Joi.string().min(3).max(30).required(),
        mimeType: Joi.string().min(3).max(30).required(),
    })

    schema.validate(data);
}

// const validateLoginData = (data) => {
//     const schema = Joi.object({
//         username: Joi.string().min(3).max(30).required(),
//         email: Joi.string().email().required(),
//         password: Joi.string().min(6).required(),
//     })

//     schema.validate(data);
// }

export { validateNewMediaData };