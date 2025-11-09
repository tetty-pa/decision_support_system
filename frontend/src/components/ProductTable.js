import React from 'react';

const ProductTable = ({ products, onEdit, onDelete }) => {
  // Функція для визначення статусу на основі аналітики
  const getStatus = (product) => {
    if (product.quantity <= product.safety_stock) {
      return { text: 'Критичний стан!', color: '#ff4d4f' };
    }
    if (product.quantity <= product.reorder_point) {
      return { text: 'Необхідне замовлення', color: '#faad14' };
    }
    // Проста евристика для надлишку: якщо запасів більше, ніж на подвійний час доставки + безпековий запас
    const surplusThreshold = 2 * product.reorder_point;
    if (product.quantity > surplusThreshold && surplusThreshold > 0) {
       return { text: 'Надлишковий запас', color: '#13c2c2' };
    }
    return { text: 'Запас в нормі', color: '#52c41a' };
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Назва товару</th>
          <th>Кількість на складі</th>
          <th>Точка поповнення (ROP)</th>
          <th>Безпековий запас (SS)</th>
          <th>Статус</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        {products.length > 0 ? (
          products.map((product) => {
            const status = getStatus(product);
            return (
              <tr key={product._id} style={{ backgroundColor: `${status.color}20` /* Додаємо прозорість */ }}>
                <td>{product.name}</td>
                <td>{product.quantity}</td>
                <td>{product.reorder_point}</td>
                <td>{product.safety_stock}</td>
                <td style={{ color: status.color, fontWeight: 'bold' }}>
                  {status.text}
                </td>
                <td>
                  <button onClick={() => onEdit(product)}>Редагувати</button>
                  <button onClick={() => onDelete(product._id)}>Видалити</button>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="6">Товари відсутні. Додайте перший товар.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ProductTable;