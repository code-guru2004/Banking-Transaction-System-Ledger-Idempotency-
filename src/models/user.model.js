const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: [true, "Email is required"],
        unique: [true, "This email is already registered"],
        trim: true,
        lowercase: true,
        match: [emailRegex, "please enter a valid email address"]
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false, // Exclude password from query results by default
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,// systemUser field cannot be changed after creation,
        select: false // Exclude systemUser from query results by default

    }
},{
    timestamps: true
});

userSchema.pre("save", async function(){ // Hash password before saving
    if(!this.isModified("password")){
        return;
    }
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    return;
});

userSchema.methods.comparePassword = async function(candidatePassword){
    // console.log(candidatePassword,this.password);
    
    return await bcrypt.compare(candidatePassword, this.password); // Returns true if passwords match, false otherwise
}

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;