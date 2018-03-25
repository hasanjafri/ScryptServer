const stripeInit = () => {
    if (process.env.DEV_ENABLE_TEST_STRIPE) {
        return require("stripe")(process.env.TEST_STRIPE_SECRET_KEY);
    } else if (process.env.STRIPE_SECRET_KEY) {
        return require("stripe")(process.env.STRIPE_SECRET_KEY);
    } else {
        return { message: "No secret key is specified in admin." };
    }
};

const createCustomer = ({ user }) => {
    // params: user
    const createStripeCustomer = stripe => {
        return new Promise((resolve, reject) => {
            stripe.customers.create({
                email: user.username
            }, (err, customer) => {
                if (err) {
                    return reject(err);
                }
                resolve(customer);
            });
        });
    }

    return new Promise((resolve, reject) => {
        const stripe = stripeInit();
        createStripeCustomer(stripe).then(customer => {
            user.stripe.customerId = customer.id;
            user.save().then(() => resolve(customer)).catch(err => reject(err));
        }).catch(err => reject(err));
    });
};

export { createCustomer };