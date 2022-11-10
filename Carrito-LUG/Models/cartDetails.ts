import { Schema, model } from "mongoose";

//Creación del Schema Carrito
const cartDetailsSchema = new Schema({
    productName: {type: String, required: true, unique: true},
    amount: {type: Number, required: true},
    price: {type: Number}
});

export default model("cartDetails", cartDetailsSchema);
