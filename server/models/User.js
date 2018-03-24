import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

class User extends Schema {
    constructor() {
        const user = super({
            username: {
                type: String,
                unique: true,
                lowercase: true,
                trim: true,
                required: true,
                minlength: [5, 'Username must be 5 characters or more.'],
            },
            password: {
                type: String,
                required: true,
                minlength: [8, 'Password must be 8 characters or more.'],
            },
            admin: { type: Boolean, default: false },
            fullName: { type: String, required: true },
            verification: {
                status: { type: Boolean, default: false },
                token: String,
                expiry: Date
            },
            resetPassword: {
                token: String,
                expiry: Date
            },
            stripe: {
                customerId: String
            },
            isDeleted: { type: Boolean, default: false },
            lastUpdated: { type: Date, default: Date.now },
            createdAt: { type: Date, default: Date.now }
        });

        user.methods.comparePassword = this.comparePassword;
        return user;
    }

    comparePassword(password) {
        return bcrypt.compareSync(password, this.password);
    }
}

export default mongoose.model('User', new User);
