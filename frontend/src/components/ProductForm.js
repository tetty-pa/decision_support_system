import React, { useState, useEffect } from 'react';

const ProductForm = ({ onSave, currentProduct, setCurrentProduct }) => {
  const [product, setProduct] = useState({
    name: '',
    quantity: '',
    service_level: 0.95,
    lead_time: 1,
    sales_history: ''
  });

  // Якщо є `currentProduct` (для редагування), заповнюємо форму його даними
  useEffect(() => {
    if (currentProduct) {
      // Перетворюємо масив історії продажів у рядок для текстового поля
      const salesHistoryString = currentProduct.sales_history ? currentProduct.sales_history.join(', ') : '';
      setProduct({ ...currentProduct, sales_history: salesHistoryString });
    } else {
      // Скидаємо форму, якщо немає товару для редагування
      setProduct({
        name: '',
        quantity: '',
        service_level: 0.95,
        lead_time: 1,
        sales_history: ''
      });
    }
  }, [currentProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Перетворюємо рядок з історією продажів назад у масив чисел
    const salesHistoryArray = product.sales_history
      .split(',')
      .map(item => Number(item.trim()))
      .filter(item => !isNaN(item) && item !== 0); // Видаляємо некоректні значення

    const productToSend = {
        ...product,
        quantity: Number(product.quantity),
        service_level: Number(product.service_level),
        lead_time: Number(product.lead_time),
        sales_history: salesHistoryArray
    };

    onSave(productToSend);
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h3>{currentProduct ? 'Редагувати товар' : 'Додати новий товар'}</h3>
      <input
        name="name"
        value={product.name}
        onChange={handleChange}
        placeholder="Назва товару"
        required
      />
      <input
        name="quantity"
        type="number"
        value={product.quantity}
        onChange={handleChange}
        placeholder="Кількість на складі"
        required
      />
      <input
        name="lead_time"
        type="number"
        value={product.lead_time}
        onChange={handleChange}
        placeholder="Час доставки (днів)"
        required
      />
      <input
        name="service_level"
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={product.service_level}
        onChange={handleChange}
        placeholder="Рівень обслуговування (0.95)"
      />
      <textarea
        name="sales_history"
        value={product.sales_history}
        onChange={handleChange}
        placeholder="Історія продажів (через кому, напр. 10, 12, 15)"
      />
      <div className="form-buttons">
        <button type="submit">{currentProduct ? 'Зберегти зміни' : 'Додати товар'}</button>
        {currentProduct && (
            <button type="button" onClick={() => setCurrentProduct(null)}>Скасувати</button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;