import {Schema , model} from "mongoose";

//Creación del Schema Productos
const productsSchema = new Schema({
    productName: {type: String, required: true, unique: true},
    amount: {type: Number, required: true},
    price: {type: Number, required: true}
});

export default model("Products", productsSchema);