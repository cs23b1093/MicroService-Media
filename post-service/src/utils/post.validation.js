import Joi from 'joi';

const validatePostData = (data) => {
    const schema = Joi.object({
        postTitle: Joi.string().min(3).max(30).required(),
        postContent: Joi.string().min(10).max(150).required(),
        mediaIds: Joi.array().items(Joi.string()),
    })

    schema.validate(data);
}

export { validatePostData };