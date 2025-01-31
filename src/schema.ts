import { Schema, model } from 'mongoose';


const IndividualSchema = new Schema({
    name: String,
    role: String,
    phoneNumber: String,
    address: String
});

const Individual = model('Individual', IndividualSchema);
