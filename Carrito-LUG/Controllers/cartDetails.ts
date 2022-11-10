import { Request, Response} from "express";
import cartDetailsModel from "../Models/cartDetails";
//Para poder obtener los Products de la base de datos, deberé importar el modelo de producto
import productsModel from "../Models/products";
import cartModel from "../Models/cart";


const cartDetailsController = {
        //Req INFORMACION QUE PONEMOS EN EL DEL POSTMAN U EN LA ESTRUCTURA DE LO BD
        //Res RESPUESTA QUE VEMOS EN EL POSTMAN.   
    
        productsInCart: async (req: Request, res: Response) => {
            try
            {   //BUSCA EL CARRITO
                const productExist = await cartModel.find()
                //SI EXISTE, BUSCA LA INFO DEL CARRITO Y LA MUESTRA
                if(productExist){
                const productSearch = await cartDetailsModel.find()
                res.status(200).send(productSearch)
                //SI NO EXISTE, LO CREA E INFORMA Q SE CREO
                }
                else{
                   cartCreate()
                   res.status(200).send(`Se creo un carrito.`)
                }    
            }
            catch (error){
                res.status(500).send(error)
            }
        },

        allCarts: async(req: Request, res: Response) => {
            try
            {
                const obtenerCarrito = await cartModel.find()
                if(obtenerCarrito)
                {   
                    res.status(200).send(obtenerCarrito)
                }else
                {
                    res.status(400).send(`No existen carritos registrados en la base de datos.`)
                }
            }
            catch(error)
            {
                res.status(500).send(error)
            }
        },
        
        addProduct: async (req: Request, res: Response) => {
            try
            {

                //SE BUSCA EL PRODUCTO QUE SE QUIERE AGREGAR, QUE SE INGRESO EN EL POSTMAN
                const productSearch = await productsModel.findOne({productName: req.body.productName});
                //SE BUSCA QUE YA SE HAYA CREADO EL CARRITO
                const productExist = await cartModel.findOne({productName: "Carrito"})
                //-----------const productExist = await cartModel.findOne({productName:  req.body.productName})
                //SI NO EXISTE, LO CREA
                if(!productExist)
                {
                    //-----------const newCarrito = new cartModel({productName: req.body.productName, cartDetails: [], totalPrice: 0});
                    //-----------newCarrito.save();
                    cartCreate();
                }
                
                
                //VE SI EXISTE EL PRODUCTO QUE SE BUSCA AGREGAR Y EL CARRITO
                if(productSearch?.productName && productExist){
                ///INFO GUARDA LA INFORMACION QUE SE QUIERE AGREGAR
                const INFO = {amount: req.body.amount, price: productSearch.price}
                //SI LA CANTIDAD QUE SE QUIERE AGREGAR ESTA DISPONIBLE, SE GUARDA EL PRODUCTO
                if(INFO.amount <= productSearch.amount ){
                    //NUEVO PRECIO DEL CARRITO/-  /  -/EL PRODUCTO QUE SE AGREGO AL CART/-  /  -/LA CANTIDAD QUE QUEDA DISPONIBLE           
                    const Totalprice = totalPrice(INFO.price, INFO.amount);
                    const newProduct = new cartDetailsModel({productName: productSearch?.productName, amount: req.body.amount, price: Totalprice}); 
                    await newProduct.save();
                    const freeStockInList = freeStock(INFO.amount, productSearch.amount);
                    //SI LA CANTIDAD ES = 0, SE BORRA DE LA BD
                    if(freeStockInList == 0)
                    {
                        
                        productExist?.cartDetails.push(newProduct)
                        productExist.totalPrice = cartListPrice(productExist.totalPrice, Totalprice);
                        productExist.save();
                        productSearch.delete();
                        
                    }//SINO, SE ENVIA LA NUEVA CANTIDAD
                    else{
                        productSearch.amount = freeStockInList;
                        productSearch.save();
                        productExist?.cartDetails.push(newProduct)
                        productExist.totalPrice = cartListPrice(productExist.totalPrice, Totalprice);
                        productExist.save();
                    }                            
                    res.status(200).send(newProduct);
                    }else
                    {
                        res.status(400).send(`No hay stock suficiente de ${req.body.productName} para agregar.`);
                    }             
                }else{
                    res.status(404).send(`El producto ${req.body.productName} no existe en la base de datos.`)
                }
                
            }
            catch(error)
            {
                res.status(500).send(error);
            }
            
        },

        
        deleteByName: async (req: Request, res: Response) => {
            try
            {
                //BUSCA EL PRODUCTO EN EL CARRITO POR EL NOMBRE
                const productInCart = await cartDetailsModel.findOne({productName: req.body.productName})
                const Products = await productsModel.findOne({productName: req.body.productName})
                const productExist = await cartModel.findOne({productName: "Carrito"})
                //-----------const productExist = await cartModel.findOne({productName: req.params.productName})
                
                if(!productExist)
                {
                    cartCreate()
                }
                
                //SI EL PRODUCTO EXISTE EN LA BD DE CART Y EN LA BD DE LA LIST
                if(productInCart?.productName && Products?.productName){
                //SE GUARDA LA CANTIDAD DEL PRODUCTO QUE HAY EN EL CARRITO PARA MANDARLO A LA LIST
                    const StockCarrito = {amount: productInCart?.amount}
                    //SE GUARDA LA CANTIDAD DEL PRODUCTO QUE HAY EN LA LIST
                    const StockProducts = {amount: Products?.amount}
                    //GUARDA EL STOCK TOTAL (stock  Cart + Stock LIST)
                    const TotalStock = totalAmount(StockCarrito.amount, StockProducts.amount);
                    const productoNombre = await cartDetailsModel.findOneAndDelete({productName: req.body.productName})
                    //Una vez eliminado la base de datos, se guardará los stock sumados a la base de datos de Products
                    Products.amount = TotalStock;
                    
                    if(productExist && productInCart.price)
                    {
                        //Eliminar valores del array
                        const deleteProductoArray = productExist.cartDetails.filter((productInCart => productInCart.productName != req.body.productName))
                        productExist.cartDetails = deleteProductoArray;
                        productExist.totalPrice = productExist.totalPrice - productInCart.price
                        productExist.save();
                    }
                    Products.save()
                    res.status(200).send(`El producto ${productInCart.productName} se elimino con exito del carrito y \nse devolvió el stock del carrito a la base de datos de Products`);                         
                // SI EXISTE EN LA BD DE CART PERO NO EN LA BD DE LIST
                }else if(productInCart?.productName && !Products?.productName && productInCart.price) 
                {
                    //SE CALCULA Y DEVUELVE EL PRECIO
                    const INFO = {amount: productInCart.amount, price: productInCart.price}
                    const productPrice = price(INFO.price, INFO.amount);
                    //SE CARGA EL PRODUCTO EN LA BD DE PRODUCTO
                    const newProducto = new productsModel({productName: productInCart.productName, amount: productInCart.amount, price: productPrice});
                    newProducto.save();
                    //Actualizar array
                    if(productExist)
                    {
                        //Eliminar valores del array
                        const deleteProductoArray = productExist.cartDetails.filter((productInCart => productInCart.productName != req.body.productName))
                        productExist.cartDetails = deleteProductoArray;
                        productExist.totalPrice = productExist.totalPrice - productInCart.price
                        productExist.save();
                    }
                    //SE BORRA EL PRODUCTO EN EL CARRITO Y SE GUARDA EN LA BD DE LIST
                    productInCart.delete();
                    res.status(200).send(`El producto ${productInCart.productName} se elimino con exito del carrito y \nse devolvió el stock del carrito a la base de datos de Products`)
                }else{
                    res.status(404).send(`El producto ${req.body.productName} no existe en la base de datos`);
                }
                
            }
            catch(error)
            {
                res.status(500);
            }
        },




        changeAmount: async (req: Request, res: Response) => {
            try
            {
                //SE BUSCA EL PRODUCTO EN EL CARRITO
                const getProductInCart = await cartDetailsModel.findOne({productName: req.body.productName})
                //SE BUSCA EL PRODUCTO EN EL LISTADO DE PRODUCTOS
                const getProductInList = await productsModel.findOne({productName: req.body.productName})
                ///SE VE SI EXISTE EL CARRITO
                const productExist = await cartModel.findOne({productName: "Carrito"})
                //-----------const productExist = await cartModel.findOne({productName: req.body.productName})
                if(!productExist)
                {
                    cartCreate();
                }
                //SI SE ENCUENTRA EL PRODUCTO BUSCADO EN EL CARRITO Y EN EL LISTADO
                if(getProductInCart && getProductInList)
                {
                    //SE CALCUTA EL STOCK TOTAL, EL STOCK SUMADO DE TODOS LADOS (cart + list)
                    const totalStock = totalAmount(getProductInCart?.amount, getProductInList?.amount)
                    //SE BUSCA EL PRECIO DEL PRODUCTO
                    const productPrice = getProductInList?.price;
                    //LA NUEVA CANTIDAD QUE SE QUIERE INGRESAR
                    const newAmount = {amount: req.body.amount}
                    //SE SACA EL STOCK QUE QUE DA DISPONIBLE EN list (list - cart)
                    const freeStockInList = freeStock(newAmount.amount, totalStock)
                    //GUARDA EL PRECIO ANTERIOR DEL CARRITO
                    const beforeCartPrice = getProductInCart.price;
                    //EL STOCK QUE QUEDA EN LA BD DE LISTA SEA MAYOR O IGUAL A 0
                    if(freeStockInList >= 0 && productPrice && productExist && getProductInCart && beforeCartPrice)
                    {
                      //SI ES DIFERENTE A 0  
                     if(newAmount.amount != 0)
                     {
                        //SI EL STOCK RESTANTE ES = 0, SE BORRA EL PRODUCTO DE LA list
                        if(freeStockInList == 0)
                        {
                            getProductInList?.delete();
                        }//SINO SE GUARDA LA NUEVA CANTIDAD EN LA list
                        else if(getProductInList?.amount != null)
                        {
                            getProductInList.amount = freeStockInList
                            getProductInList.save();
                        }
                        //SE ACTUALIZA LA NUEVA CANTIDAD Y EL NUEVO PRECIO DE EL CARRITO
                        getProductInCart.amount = newAmount.amount
                        getProductInCart.price = productPrice * newAmount.amount;
                        getProductInCart.save();
                       
                        //Comprobar si existe solo un producto en el carritO
                        productExist.totalPrice = productExist.totalPrice + getProductInCart.price - beforeCartPrice 
                        productExist.save();
                        res.status(200).send(`Se actualizo con exito el producto del carrito:\n* ${req.body.productName}\n* amount: ${newAmount.amount}\n\n`)
                     }
                     else
                      {
                        if(productExist && getProductInCart.price)
                        {
                        //ELIMINA LOS VALORES DEL ARRAY DE DETALLES Y LO GUARDA
                        productExist.cartDetails = productExist.cartDetails.filter((producto) => {
                            return producto.productName != getProductInCart.productName
                        })
                        productExist.totalPrice = productExist.totalPrice - getProductInCart.price
                        productExist.save();
                        }           
                        //SI LA NUEVA CANTIDAD ES 0 , SE ELIMINA EL PRODUCTO DEL CARRITO
                        getProductInList.amount = freeStockInList;
                        getProductInList.save();
                        getProductInCart.delete();
                        res.status(200).send(`Se elimino el producto del carrito y se envió el stock restante a \nla base de datos de Products.`)
                      }    
                        
                    }else
                    {
                        res.status(400).send(`No hay stock suficiente.`);
                    }
                } 
                //SI NO EXISTE EL PRODUCTO EN EL CARRITO PERO SI EN LA LISTA    
                if(!getProductInCart && getProductInList)
                {
                    res.status(400).send(`No se puede actualizar, el producto ${req.body.productName} no existe en el carrito.`)
                }
                //SI EXISTE EL PRODUCTO EN EL CARRITO PERO NO EN LA LISTA        
                if(getProductInCart && !getProductInList)
                {
                    //SE CALCUTA EL STOCK TOTAL, EL STOCK SUMADO DE TODOS LADOS (cart + list)
                    const totalStock = getProductInCart.amount
                    //SE BUSCA EL PRECIO DEL PRODUCTO
                    const productPrice = price(getProductInCart.price, totalStock)
                    //LA NUEVA CANTIDAD QUE SE QUIERE INGRESAR
                    const newAmount = {amount: req.body.amount}
                    //SE SACA EL STOCK QUE QUE DA DISPONIBLE EN list (list - cart)
                    const freeStockInList = freeStock(newAmount.amount, totalStock)
                    //GUARDA EL PRECIO ANTERIOR DEL CARRITO
                    const beforeCartPrice = getProductInCart.price;
                    //SI EL STOCK QUE HAY EN LA LISTA ES MAYOR A 0
                    if(freeStockInList > 0)
                    {
                        //SI LA NUEVA CANTIDAD ES 0, SE BORRA EL PRODUCTO DEL CARRITO Y SE SUMA A LA BD DE LISTA
                        if(newAmount.amount == 0 && productExist && getProductInCart.price)
                        {
                            const createProduct = new productsModel({productName: getProductInCart.productName, amount: freeStockInList, price: productPrice})
                            createProduct.save();
                           //ELIMINA EL ARRAY DE DETAILS
                            productExist.cartDetails = productExist.cartDetails.filter((producto) => {
                            return producto.productName != getProductInCart.productName
                            })
                            productExist.totalPrice = productExist.totalPrice - getProductInCart.price
                            productExist.save();
                            getProductInCart.delete();
                            res.status(200).send(`Se elimino el producto ${req.body.productName} del carrito \ny se devolvió el stock a la base de datos Products.`)
                        } 
                        if (newAmount.amount > 0 && productExist && getProductInCart.price && beforeCartPrice)
                        {
                            const createProduct = new productsModel({productName: getProductInCart.productName, amount: freeStockInList, price: productPrice})
                            getProductInCart.amount = newAmount.amount
                            getProductInCart.price = totalPrice(productPrice, newAmount.amount)
                            createProduct.save();
                            getProductInCart.save();
                                productExist.cartDetails.push(getProductInCart);
                                productExist.totalPrice = productExist.totalPrice + getProductInCart.price - beforeCartPrice 
                                productExist.save();
                            res.status(200).send(`Se actualizo con exito el producto del carrito:\n* Producto: ${getProductInCart.productName}\n* Nueva amount: ${getProductInCart.amount}\n* Nuevo price: ${getProductInCart.price}\n\nSe devolvió a la base de datos producto:\n* Producto: ${req.body.productName}\n* Stock devuelto: ${freeStockInList}`)
                        }                       
                    }else
                    {
                        res.status(400).send(`No se pudo actualizar, debido a que supero la amount de stock, el stock total del producto ${getProductInCart.productName} es de: ${getProductInCart.amount}`)
                    }
                }
                if(!getProductInCart && !getProductInList)
                {
                    res.status(400).send(`El producto ${req.body.productName} no existe.`)
                }
                
            }
            catch (error)
            {
                res.status(500).send(`Error en el servidor`);
            }
               
        },






































        moreProduct: async (req: Request, res: Response) => {
            try
            {
                //Se obtendrá el producto de la base de datos del carrito
                const getProductInCart = await cartDetailsModel.findOne({productName: req.body.productName})
                //Se obtendrá el producto de la base de datos de producto
                const getProductInList = await productsModel.findOne({productName: req.body.productName})
                //El condicional este nos dirá si existen los dos Products en sus respectivas base de datos
                const productExist = await cartModel.findOne({productName: "Carrito"})
                //-----------const productExist = await cartModel.findOne({productName: req.body.productName})
                if(!productExist)
                {
                    cartCreate();
                }

                if(getProductInCart && getProductInList)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = totalAmount(getProductInCart?.amount, getProductInList?.amount)
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = getProductInList?.price;
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = getProductInCart.amount + 1;
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount, totalStock)
                     //Crear una variable para guardar el price antiguo
                    const beforeCartPrice = getProductInCart.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de Products no sea negativa
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList >= 0 && productPrice && productExist && getProductInCart && beforeCartPrice)
                    {
                        
                     if(newAmount != 0)
                     {
                        //Sí stock restante es 0 se borrará el producto de la base de datos
                        if(freeStockInList == 0)
                        {
                            getProductInList?.delete();
                        }else if(getProductInList?.amount != null)
                        {
                            getProductInList.amount = freeStockInList
                            getProductInList.save();
                        }
                       
                        getProductInCart.amount = newAmount
                        getProductInCart.price = productPrice * newAmount;
                        getProductInCart.save();
                        //Actualizar Array
                        const index = productExist.cartDetails.findIndex((producto) => {
                            return producto.productName == getProductInCart.productName
                        });
                        const updateArray = productExist.cartDetails.splice(index, 1)
                        productExist.cartDetails.push(getProductInCart);
                        //Comprobar si existe solo un producto en el carritp
                        productExist.totalPrice = productExist.totalPrice + getProductInCart.price - beforeCartPrice 
                        productExist.save();
                        res.status(200).send(`Se actualizo con exito el producto del carrito:\n* ${req.body.productName}\n* amount: ${newAmount}\n\n`)
                     }
                     else
                      {
                        if(productExist && getProductInCart.price)
                        {
                        //Eliminar valores del array
                           
                        productExist.cartDetails = productExist.cartDetails.filter((producto) => {
                            return producto.productName != getProductInCart.productName
                        })
                        productExist.totalPrice = productExist.totalPrice - getProductInCart.price
                        productExist.save();
                        }           
                        //Se eliminará el producto del carrito sí la nueva amount es 0
                        getProductInList.amount = freeStockInList;
                        getProductInList.save();
                        getProductInCart.delete();
                        res.status(200).send(`Se elimino el producto del carrito y se envió el stock restante a \nla base de datos de Products.`)
                      }    
                        
                    }else
                    {
                        res.status(400).send(`No hay stock suficiente.`);
                    }
                } 
                //El condicional este nos dirá si no existe en la base de datos carrito pero si existe el producto en la base de datos de producto     
                if(!getProductInCart && getProductInList)
                {
                    res.status(400).send(`No se puede actualizar, el producto ${req.body.productName} no existe en el carrito.`)
                }
                // El condicional se activa si existe el producto en el carrito pero no en la base de datos de producto          
                if(getProductInCart && !getProductInList)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = getProductInCart.amount
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = price(getProductInCart.price, totalStock)
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = {amount: req.body.amount}
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount.amount, totalStock)
                    const beforeCartPrice = getProductInCart.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de Products no sea negativa ni 0
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList > 0)
                    {
                        //Sí la nueva amount es 0, entonces se borrará el producto de la base de datos y se devolverá todo sus valores a la base de datos Products
                        if(newAmount.amount == 0 && productExist && getProductInCart.price)
                        {
                            const createProduct = new productsModel({productName: getProductInCart.productName, amount: freeStockInList, price: productPrice})
                            createProduct.save();
                           //Eliminar valores del array
                            productExist.cartDetails = productExist.cartDetails.filter((producto) => {
                            return producto.productName != getProductInCart.productName
                            })
                            productExist.totalPrice = productExist.totalPrice - getProductInCart.price
                            productExist.save();
                            getProductInCart.delete();
                            res.status(200).send(`Se elimino el producto ${req.body.productName} del carrito \ny se devolvió el stock a la base de datos Products.`)
                        } 
                        if (newAmount.amount > 0 && productExist && getProductInCart.price && beforeCartPrice)
                        {
                            const createProduct = new productsModel({productName: getProductInCart.productName, amount: freeStockInList, price: productPrice})
                            getProductInCart.amount = newAmount.amount
                            getProductInCart.price = totalPrice(productPrice, newAmount.amount)
                            createProduct.save();
                            getProductInCart.save();
                            //Actualizar Array
                            const index = productExist.cartDetails.findIndex((producto) => {
                                return producto.productName == getProductInCart.productName
                                });
                                const updateArray = productExist.cartDetails.splice(index, 1)
                                productExist.cartDetails.push(getProductInCart);
                                //Comprobar si existe solo un producto en el carritp
                                productExist.totalPrice = productExist.totalPrice + getProductInCart.price - beforeCartPrice 
                                productExist.save();
                            res.status(200).send(`Se actualizo con exito el producto del carrito:\n* Producto: ${getProductInCart.productName}\n* Nueva amount: ${getProductInCart.amount}\n* Nuevo price: ${getProductInCart.price}\n\nSe devolvió a la base de datos producto:\n* Producto: ${req.body.productName}\n* Stock devuelto: ${freeStockInList}`)
                        }                       
                    }else
                    {
                        res.status(400).send(`No se pudo actualizar, debido a que supero la amount de stock, el stock total del producto ${getProductInCart.productName} es de: ${getProductInCart.amount}`)
                    }
                }
                if(!getProductInCart && !getProductInList)
                {
                    res.status(400).send(`El producto ${req.body.productName} no existe.`)
                }
                
            }
            catch (error)
            {
                res.status(500).send(`Error en el servidor`);
            }
               
        },












        lessProduct: async (req: Request, res: Response) => {
            try
            {
                //Se obtendrá el producto de la base de datos del carrito
                const getProductInCart = await cartDetailsModel.findOne({productName: req.body.productName})
                //Se obtendrá el producto de la base de datos de producto
                const getProductInList = await productsModel.findOne({productName: req.body.productName})
                //El condicional este nos dirá si existen los dos Products en sus respectivas base de datos
                const productExist = await cartModel.findOne({productName: "Carrito"})
                //-----------const productExist = await cartModel.findOne({productName: req.body.productName})
                if(!productExist)
                {
                    cartCreate();
                }

                if(getProductInCart && getProductInList)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = totalAmount(getProductInCart?.amount, getProductInList?.amount)
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = getProductInList?.price;
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = getProductInCart.amount - 1;
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount, totalStock)
                     //Crear una variable para guardar el price antiguo
                    const beforeCartPrice = getProductInCart.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de Products no sea negativa
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList >= 0 && productPrice && productExist && getProductInCart && beforeCartPrice)
                    {
                        
                     if(newAmount != 0)
                     {
                        //Sí stock restante es 0 se borrará el producto de la base de datos
                        if(newAmount == 0)
                        {
                            getProductInList?.delete();
                        }else if(getProductInList?.amount != null)
                        {
                            getProductInList.amount = freeStockInList
                            getProductInList.save();
                        }
                       
                        getProductInCart.amount = newAmount
                        getProductInCart.price = productPrice * newAmount;
                        getProductInCart.save();
                        //Actualizar Array
                        const index = productExist.cartDetails.findIndex((producto) => {
                            return producto.productName == getProductInCart.productName
                        });
                        const updateArray = productExist.cartDetails.splice(index, 1)
                        productExist.cartDetails.push(getProductInCart);
                        //Comprobar si existe solo un producto en el carritp
                        productExist.totalPrice = productExist.totalPrice + getProductInCart.price - beforeCartPrice 
                        productExist.save();
                        res.status(200).send(`Se actualizo con exito el producto del carrito:\n* ${req.body.productName}\n* amount: ${newAmount}\n\n`)
                     }
                     else
                      {
                        if(productExist && getProductInCart.price)
                        {
                        //Eliminar valores del array
                           
                        productExist.cartDetails = productExist.cartDetails.filter((producto) => {
                            return producto.productName != getProductInCart.productName
                        })
                        productExist.totalPrice = productExist.totalPrice - getProductInCart.price
                        productExist.save();
                        }           
                        //Se eliminará el producto del carrito sí la nueva amount es 0
                        getProductInList.amount = freeStockInList;
                        getProductInList.save();
                        getProductInCart.delete();
                        res.status(200).send(`Se elimino el producto del carrito y se envió el stock restante a \nla base de datos de Products.`)
                      }    
                        
                    }else
                    {
                        res.status(400).send(`No hay stock suficiente.`);
                    }
                } 
                //El condicional este nos dirá si no existe en la base de datos carrito pero si existe el producto en la base de datos de producto     
                if(!getProductInCart && getProductInList)
                {
                    res.status(400).send(`No se puede actualizar, el producto ${req.body.productName} no existe en el carrito.`)
                }
                // El condicional se activa si existe el producto en el carrito pero no en la base de datos de producto          
                if(getProductInCart && !getProductInList)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = getProductInCart.amount
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = price(getProductInCart.price, totalStock)
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = {amount: req.body.amount}
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount.amount, totalStock)
                    const beforeCartPrice = getProductInCart.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de Products no sea negativa ni 0
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList > 0)
                    {
                        //Sí la nueva amount es 0, entonces se borrará el producto de la base de datos y se devolverá todo sus valores a la base de datos Products
                        if(newAmount.amount == 0 && productExist && getProductInCart.price)
                        {
                            const createProduct = new productsModel({productName: getProductInCart.productName, amount: freeStockInList, price: productPrice})
                            createProduct.save();
                           //Eliminar valores del array
                            productExist.cartDetails = productExist.cartDetails.filter((producto) => {
                            return producto.productName != getProductInCart.productName
                            })
                            productExist.totalPrice = productExist.totalPrice - getProductInCart.price
                            productExist.save();
                            getProductInCart.delete();
                            res.status(200).send(`Se elimino el producto ${req.body.productName} del carrito \ny se devolvió el stock a la base de datos Products.`)
                        } 
                        if (newAmount.amount > 0 && productExist && getProductInCart.price && beforeCartPrice)
                        {
                            const createProduct = new productsModel({productName: getProductInCart.productName, amount: freeStockInList, price: productPrice})
                            getProductInCart.amount = newAmount.amount
                            getProductInCart.price = totalPrice(productPrice, newAmount.amount)
                            createProduct.save();
                            getProductInCart.save();
                            //Actualizar Array
                            const index = productExist.cartDetails.findIndex((producto) => {
                                return producto.productName == getProductInCart.productName
                                });
                                const updateArray = productExist.cartDetails.splice(index, 1)
                                productExist.cartDetails.push(getProductInCart);
                                //Comprobar si existe solo un producto en el carritp
                                productExist.totalPrice = productExist.totalPrice + getProductInCart.price - beforeCartPrice 
                                productExist.save();
                            res.status(200).send(`Se actualizo con exito el producto del carrito:\n* Producto: ${getProductInCart.productName}\n* Nueva amount: ${getProductInCart.amount}\n* Nuevo price: ${getProductInCart.price}\n\nSe devolvió a la base de datos producto:\n* Producto: ${req.body.productName}\n* Stock devuelto: ${freeStockInList}`)
                        }                       
                    }else
                    {
                        res.status(400).send(`No se pudo actualizar, debido a que supero la amount de stock, el stock total del producto ${getProductInCart.productName} es de: ${getProductInCart.amount}`)
                    }
                }
                if(!getProductInCart && !getProductInList)
                {
                    res.status(400).send(`El producto ${req.body.productName} no existe.`)
                }
                
            }
            catch (error)
            {
                res.status(500).send(`Error en el servidor`);
            }
               
        },

}



















function price(priceTOTAL: any, amount: any)
{
    //price = priceTOTAL/amount
    return priceTOTAL/amount;
}

function totalAmount(amount: any, freeStockInList: any)
{
    return amount + freeStockInList;
}

function freeStock(newAmount: any, totalStock: any)
{
    //Ecuación utilizada: freeStockInList = totalStock - newAmount
    return totalStock - newAmount;
}

function totalPrice(price: any, amount: any)
{
    //Ecuación utilizada: priceTOTAL = price * amount
    return price * amount;
}

function cartCreate()
{
    const newCarrito = new cartModel({productName: "Carrito", cartDetails: [], totalPrice: 0});
    newCarrito.save();
}

function cartListPrice(priceTOTALCARRITOLIST: any, priceTOTALCARRITODETAILS: any)
{
    return priceTOTALCARRITODETAILS + priceTOTALCARRITOLIST;
}

export default cartDetailsController;