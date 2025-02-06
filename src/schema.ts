import { Schema, model } from 'mongoose';


const IndividualSchema = new Schema({
    name: String,
    role: String,
    phoneNumber: String,
    address: String
});

const Individual = model('Individual', IndividualSchema);

const CaseSchema = new Schema({
    title: String,
    description: String,
    date: { type: Date, default: Date.now },
    location: String,
    individuals: [{ type: Schema.Types.ObjectId, ref: 'Individual' }]
});
const Case = model('Case', CaseSchema);

const TestimonySchema = new Schema({
    witness: { type: Schema.Types.ObjectId, ref: 'Individual' },
    case: { type: Schema.Types.ObjectId, ref: 'Case' },
    statement: String

});
const Testimony = model('Testimony', TestimonySchema);

const CallRecordSchema = new Schema({
    caller: { type: Schema.Types.ObjectId, ref: 'Individual' },
    receiver: { type: Schema.Types.ObjectId, ref: 'Individual' },
    antennaLocation: String
});
const CallRecord = model('CallRecord', CallRecordSchema);

const LocationSchema = new Schema({
    name: String,
    address: String,
    latitude: Number,
    longitude: Number
});
const Location = model('Location', LocationSchema);


export { Individual, Case, Testimony, CallRecord ,Location};
