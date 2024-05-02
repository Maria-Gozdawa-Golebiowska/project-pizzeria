/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', 
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', 
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, 

    cart: {
      defaultDeliveryFee: 20,
    },

    db: {
      url: "//localhost:3131",
      products: "products",
      orders: "orders",
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.dom = {};

      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu() {
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);

      
    }

    initAccordion() {
      const thisProduct = this;
      const clickableTrigger = thisProduct.element.querySelector('.product__header');
      clickableTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        const activeProducts = document.querySelectorAll('.product.active');
        activeProducts.forEach(product => {
          if (product !== thisProduct.element) {
            product.classList.remove('active');
          }
        });
        thisProduct.element.classList.toggle('active');
      });
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);

      let price = thisProduct.data.price;

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for (let optionId in param.options) {
          const option = param.options[optionId];

          const optionImage = thisProduct.element.querySelector(`.${paramId}-${optionId}`);

          if (optionImage) {
            if (formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId)) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }

          if (formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId) && !option.default) {
            price += option.price;
          } else if (!formData.hasOwnProperty(paramId) || !formData[paramId].includes(optionId) && option.default) {
            price += option.price;
          }
        }
      }
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
    }

    getElements() {
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelectorAll(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }


    prepareCartProduct() {
      const thisProduct = this;

      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        params: {},
        price: thisProduct.priceElem.innerHTML, 
        priceSingle: thisProduct.data.price, 
      };
      return productSummary;
    }
    prepareCartProductParams() {
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.form);

      const params = {};

      for (let paramId in thisProduct.data.params) {

        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {},
        };

        for (let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected =
            formData[paramId] && formData[paramId].includes(optionId);
          if (optionSelected) {
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
  
  
    addToCart(){
      const thisProduct = this;
      const cartProduct = thisProduct.prepareCartProduct();
      cartProduct.params = thisProduct.prepareCartProductParams();
      app.cart.add(cartProduct);
    }
  }



  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.initActions();

      if (thisWidget.input.value !== '' && !isNaN(thisWidget.input.value)) {
        thisWidget.setValue(thisWidget.input.value);
      } else {
        thisWidget.setValue(settings.amountWidget.defaultValue);
      }
    }

    getElements(element) {
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);


      thisWidget.value = parseInt(thisWidget.input.value) || settings.amountWidget.defaultValue;
    }

    setValue(value) {
      const thisWidget = this;

      if (isNaN(value)) {
        value = 1;
      } else {
        value = parseInt(value);
        if (value < settings.amountWidget.defaultMin) {
          value = settings.amountWidget.defaultMin;
        } else if (value > settings.amountWidget.defaultMax) {
          value = settings.amountWidget.defaultMax;
        }
      }

      thisWidget.value = value;
      thisWidget.input.value = thisWidget.value;

      if (!isNaN(value) && value >= settings.amountWidget.defaultMin && value <= settings.amountWidget.defaultMax) {
        thisWidget.announce();
      }
    }


    initActions() {
      const thisWidget = this;
    
      thisWidget.input.addEventListener('change', () => {
        const value = thisWidget.input.value !== '' ? thisWidget.input.value : settings.amountWidget.defaultValue;
        thisWidget.setValue(value);
      });
      thisWidget.linkDecrease.addEventListener('click', (event) => {
        event.preventDefault();
        const newValue = thisWidget.input.value !== '' ? thisWidget.input.value - 1 : settings.amountWidget.defaultValue - 1;
        thisWidget.setValue(newValue);
      });

      thisWidget.linkIncrease.addEventListener('click', (event) => {
        event.preventDefault();
        const newValue = thisWidget.input.value !== '' ? parseInt(thisWidget.input.value) + 1 : settings.amountWidget.defaultValue + 1;
        thisWidget.setValue(newValue);
      });
      
    }
    
    announce() {
      const thisWidget = this;
      const event = new Event('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }


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
    
    
      console.log("totalNumber:", thisCart.totalNumber);
      console.log("subtotalPrice:", thisCart.subtotalPrice);
      console.log("deliveryFee:", thisCart.deliveryFee);
      console.log("totalPrice:", thisCart.totalPrice);
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
  

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element){
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;

      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
  }
  getData() {
    const thisCartProduct = this;
    const productSummary = {
      id: thisCartProduct.id,
      name: thisCartProduct.name,
      amount: thisCartProduct.totalNumber,
      priceSingle: thisCartProduct.priceSingle,
      price: thisCartProduct.price,
      params: thisCartProduct.params,
    };
    return productSummary;
  }

  initAmountWidget() {
    const thisCartProduct = this;
    thisCartProduct.amountWidget = new AmountWidget(
      thisCartProduct.dom.amountWidget
    );
    thisCartProduct.dom.amountWidget.addEventListener("updated", function () {
      thisCartProduct.amount = thisCartProduct.amountWidget.value;


      thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;

      thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
    });
  }
  remove(){
    const thisCartProduct = this;

    const event = new CustomEvent ('remove', {
      bubbles: true,
    detail: {
      cartProduct: thisCartProduct,
    }
    });
    thisCartProduct.dom.wrapper.dispatchEvent(event);
  }
  initActions(){
    const thisCartProduct = this;
    thisCartProduct.dom.edit.addEventListener('click', (event) => {
      event.preventDefault();
    });
    thisCartProduct.dom.remove.addEventListener('click', (event) =>{
      event.preventDefault();
      thisCartProduct.remove();
    })
  }

  }

const app = {

   initMenu: function () {
      const thisApp = this;

      for (let productData in thisApp.data.products) {
        new Product(
          thisApp.data.products[productData].id,
          thisApp.data.products[productData]
        );
      }
    },

  initCart: function(){
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem, settings);
  
  },

  initData: function () {
    const thisApp = this;

    thisApp.data = {};

    const url = settings.db.url + "/" + settings.db.products;

    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        console.log("parsedResponse", parsedResponse);

        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;

        /* execute initMenu method */
        thisApp.initMenu();
      });

    console.log("thisApp.data", JSON.stringify(thisApp.data));
  },

  init: function () {
    const thisApp = this;
    thisApp.initData();
    thisApp.initCart();
  }
};

app.init();
}
