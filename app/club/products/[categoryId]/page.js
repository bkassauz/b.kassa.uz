'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { useClubAuth } from '../../../../lib/ClubAuthContext';
import ProductFormModal from '../../../../components/ProductFormModal';
import styles from '../../club.module.css';

export default function CategoryDetailPage() {
  const { categoryId } = useParams();
  const router = useRouter();
  const { club } = useClubAuth();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  async function loadData() {
    setLoading(true);
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', categoryId)
      .single();

    if (catErr || !cat) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    setCategory(cat);
    setProducts(prods || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [categoryId]);

  function openAdd() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  if (loading) {
    return <p className={styles.mutedSmall}>Yuklanmoqda...</p>;
  }

  if (notFound) {
    return (
      <div className={styles.panel}>
        <p className={styles.errorText}>Kategoriya topilmadi.</p>
        <button className={styles.btnGhost} onClick={() => router.push('/club/products')}>
          ← Kategoriyalarga qaytish
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>{category.name}</h1>
        <p>Kategoriyadagi mahsulotlar</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <button className={styles.btnGhost} onClick={() => router.push('/club/products')}>
            ← Kategoriyalar
          </button>
          <button className={styles.btnPrimary} onClick={openAdd}>
            + Mahsulot qo'shish
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Nomi</th>
                <th>Soni</th>
                <th>Kelish narxi</th>
                <th>Sotuv narxi</th>
                <th>O'lchov</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={6} className={styles.tableEmpty}>Bu kategoriyada hali mahsulot yo'q.</td></tr>
              )}
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={styles.tableRowClickable}
                  onClick={() => openEdit(p)}
                >
                  <td>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className={styles.productThumb} />
                    ) : (
                      <div className={styles.productThumbPlaceholder}>—</div>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td className={Number(p.quantity) <= 5 ? styles.lowStock : ''}>{p.quantity}</td>
                  <td>{Number(p.cost_price).toLocaleString('ru-RU')}</td>
                  <td>{Number(p.sale_price).toLocaleString('ru-RU')}</td>
                  <td>{p.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <ProductFormModal
          gameClubId={club.id}
          categoryId={categoryId}
          categoryName={category.name}
          product={editingProduct}
          onClose={() => setFormOpen(false)}
          onSaved={loadData}
        />
      )}
    </>
  );
}
