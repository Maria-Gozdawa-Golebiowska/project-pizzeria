import {settings, select, templates, classNames} from "../settings.js";
import utils from "../utils.js";
import CartProduct from "./CartProduct.js";




class Cart {
    constructor(element, settings){
      
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      thisCart.update();
      thisCart.settings = settings;
      thisCart.subtotalPrice = 0;
      thisCart.deliveryFee = thisCart.settings.cart.defaultDeliveryFee; 
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice); 
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice); 
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber); 
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);   
    }

    initActions() {
      const thisCart = this;
  
      thisCart.dom.toggleTrigger.addEventListener('click', function() {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      })
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      })
      thisCart.dom.form.addEventListener('submit', function(event){
       event.preventDefault();
       thisCart.sendOrder();
      });
    }

    add(menuProduct){
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();
      
    }
    update() {
      const thisCart = this;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
    
      for (const product of thisCart.products) {
        thisCart.totalNumber += parseInt(product.amount);
        thisCart.subtotalPrice += parseFloat(product.price);
      }
    
      if (thisCart.products.length > 0) {
        thisCart.deliveryFee = thisCart.settings.cart.defaultDeliveryFee;
      } else {
        thisCart.deliveryFee = 0;
      }
    
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice.toFixed(2);
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice.toFixed(2);
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee.toFixed(2);

      const totalPriceSummary = document.querySelector('.cart__order-total .cart__order-price-sum strong');
      totalPriceSummary.innerHTML = thisCart.totalPrice.toFixed(2);
    
    }

    remove(menuProduct) {
      const thisCart = this;
      menuProduct.dom.wrapper.remove();
      const index = thisCart.products.indexOf(menuProduct);
      thisCart.products.splice(index, 1);
      thisCart.update();
    }
    sendOrder() {
      const thisCart = this;
      const url = 'http://' + settings.db.url + '/' + settings.db.orders;
      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };
      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options);
    }
  }

  export default Cart;