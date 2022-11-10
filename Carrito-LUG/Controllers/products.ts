import { Request, Response} from "express";
import productsModel from "../Models/products";

//Controladora de Productos
const productController = {
    
    //MUESTRA TODOS LOS PRODUCTOS EN LA BD
    allProducts: async (req: Request, res: Response) => {
        try
        { //BUSCA LOS PRODUCTOS Y LOS MUESTRA
            const productSearch = await productsModel.find()
            res.status(200).send(productSearch)
        }
        catch (error)
        {
            res.status(500).send(error)
        }
    },

    //MUESTRA UN PRODUCTO DE LA BD POR SU NOMBRE
    productByName: async (req: Request, res: Response) => {
        try
        {
            const productSearchUnique = await productsModel.findOne({... req.params})
            
            //Sí el producto no existe la API mandará un HTTP STATUS NOT FOUND
            if(productSearchUnique?.productName != undefined)
            {
                res.status(200).send(productSearchUnique)
            }else{
                res.status(404).send(`El producto escrito en los parametros no existe en la base de datos.`);
            }
        }
        catch (error)
        {
            res.status(500).send(error)
        }
    },

    //AGREGA UN PRODUCTO A LA LIST
    newProduct: async (req: Request, res: Response) => {
        try 
        {
             
            const productExist = await productsModel.findOne({productName: req.body.productName})
            if(productExist){
                //EL PRODUCTO YA ESTA EN LA BD
                res.status(400).send(`El producto ${productExist.productName} ya se encuentra en la base de datos`)
            }else
            {
                const newProduct = new productsModel({... req.body})
                // SE GUARDA CON LAS VALIDACIONES
                if(newProduct.amount > 0 && newProduct.productName != "" && newProduct.price >= 0)
                {
                await newProduct.save()
                res.status(200).send(newProduct)
                }else
                {
                    //BAD REQUEST 
                    res.status(400).send(`* La cantidad de productos que se desea agregar no puede ser de 0 ni inferior a este\n* Tampoco puede tener un nombre de caracter vacio\n* Los precios deben ser superior o igual a 0`);
                }                           
            }         
        } catch (error) {
            //Los valos de status son los tipos de errores que nosotros queremos que salga -> 500 es error de servidor
            res.status(500).send(error)
        }
    },

    //ELIMINA UN PRODUCTO POR SU NOMBRE
    deleteByName: async (req: Request, res: Response) => {
        try
        {
            //Aquí se programó para que sólo se escriba el parametro que se desea eliminar
            const productExist = await productsModel.findOne({... req.params})
            //Revisará sí existe el producto deseado
            if(productExist?.productName != undefined || productExist?.productName != null){
                const productoNombre = await productsModel.findOneAndDelete({... req.params});
                res.status(200).send(`Se elimino ${productoNombre?.productName} y sus respectivos valores de la base de datos.`);
            }
            else
            {
                res.status(404).send(`El producto ${req.params.productName} no existe en la base de datos.`) 
            }
        }
        catch(error)
        {
            res.status(500);
        }
    },

    
}
//Exportar los controladores
export default productController