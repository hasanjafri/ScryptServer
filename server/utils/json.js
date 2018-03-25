
const DEFAULT_ERROR_MESSAGE = `Sorry, something happened. We couldn't process your request.`;
const VALIDATION_ERROR_MESSAGE = `Invalid parameters. Please check your request again.`

function jsonErr(res, err = DEFAULT_ERROR_MESSAGE, status = 500) {
    console.log(err);
    return res.status(status).json({ message: err });
};

function jsonValidationErr(res) {
    let message = VALIDATION_ERROR_MESSAGE;
    return res.status(500).json({ message });
};

function jsonSuccess(res, data = {}, status = true) {
    return res.status(200).json({
        date: new Date(),
        success: status,
        data
    });
};

export { jsonErr, jsonValidationErr, jsonSuccess };