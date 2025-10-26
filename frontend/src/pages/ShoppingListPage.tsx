import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check,
  Download,
  Share2,
  Crown,
  Camera,
  AlertCircle,
  Package,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

interface ShoppingItem {
  _id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  productId?: string;
  score?: number;
}

interface ShoppingList {
  _id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
  shared: boolean;
}

const CATEGORIES = [
  { id: 'fruits-legumes', label: 'Fruits & Legumes', icon: '🥕' },
  { id: 'viandes-poissons', label: 'Viandes & Poissons', icon: '🥩' },
  { id: 'produits-laitiers', label: 'Produits Laitiers', icon: '🥛' },
  { id: 'epicerie', label: 'Epicerie', icon: '🛒' },
  { id: 'surgeles', label: 'Surgeles', icon: '❄️' },
  { id: 'boissons', label: 'Boissons', icon: '🥤' },
  { id: 'hygiene', label: 'Hygiene & Beaute', icon: '🧴' },
  { id: 'entretien', label: 'Entretien', icon: '🧼' },
  { id: 'autres', label: 'Autres', icon: '📦' }
];

const ShoppingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({
    name: '',
    quantity: 1,
    unit: 'unite',
    category: 'autres',
    checked: false
  });

  const [expandedCategories, setExpandedCategories] = useState<string[]>(['fruits-legumes']);

  useEffect(() => {
    checkPremiumAndLoadLists();
  }, []);

  const checkPremiumAndLoadLists = async () => {
    try {
      const token = localStorage.getItem('ecolojia_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const profileRes = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsPremium(profileRes.data.user?.isPremium || false);

      const listsRes = await axios.get(`${API_URL}/api/shopping-lists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedLists = listsRes.data.lists || [];
      setLists(fetchedLists);
      
      if (fetchedLists.length > 0) {
        setActiveListId(fetchedLists[0]._id);
      }
    } catch (error) {
      console.error('Erreur chargement listes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!newListName.trim()) return;

    try {
      const token = localStorage.getItem('ecolojia_token');
      const response = await axios.post(
        `${API_URL}/api/shopping-lists`,
        { name: newListName, items: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newList = response.data.list;
      setLists([...lists, newList]);
      setActiveListId(newList._id);
      setNewListName('');
      setShowNewListForm(false);
    } catch (error) {
      console.error('Erreur creation liste:', error);
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm('Supprimer cette liste ?')) return;

    try {
      const token = localStorage.getItem('ecolojia_token');
      await axios.delete(`${API_URL}/api/shopping-lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedLists = lists.filter(l => l._id !== listId);
      setLists(updatedLists);
      
      if (activeListId === listId && updatedLists.length > 0) {
        setActiveListId(updatedLists[0]._id);
      } else if (updatedLists.length === 0) {
        setActiveListId(null);
      }
    } catch (error) {
      console.error('Erreur suppression liste:', error);
    }
  };

  const addItem = async () => {
    if (!activeListId || !newItem.name?.trim()) return;

    const activeList = lists.find(l => l._id === activeListId);
    if (!activeList) return;

    if (!isPremium && activeList.items.length >= 20) {
      alert('Limite gratuite atteinte (20 articles). Passez Premium pour listes illimitees.');
      return;
    }

    try {
      const token = localStorage.getItem('ecolojia_token');
      const itemToAdd = {
        ...newItem,
        name: newItem.name!,
        quantity: newItem.quantity || 1,
        unit: newItem.unit || 'unite',
        category: newItem.category || 'autres',
        checked: false
      };

      const response = await axios.post(
        `${API_URL}/api/shopping-lists/${activeListId}/items`,
        itemToAdd,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedList = response.data.list;
      setLists(lists.map(l => l._id === activeListId ? updatedList : l));
      
      setNewItem({
        name: '',
        quantity: 1,
        unit: 'unite',
        category: 'autres',
        checked: false
      });
      setShowNewItemForm(false);
    } catch (error) {
      console.error('Erreur ajout article:', error);
    }
  };

  const toggleItemCheck = async (itemId: string) => {
    if (!activeListId) return;

    const activeList = lists.find(l => l._id === activeListId);
    if (!activeList) return;

    try {
      const token = localStorage.getItem('ecolojia_token');
      await axios.patch(
        `${API_URL}/api/shopping-lists/${activeListId}/items/${itemId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedItems = activeList.items.map(item => 
        item._id === itemId ? { ...item, checked: !item.checked } : item
      );

      setLists(lists.map(l => 
        l._id === activeListId ? { ...l, items: updatedItems } : l
      ));
    } catch (error) {
      console.error('Erreur toggle article:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!activeListId) return;

    try {
      const token = localStorage.getItem('ecolojia_token');
      await axios.delete(
        `${API_URL}/api/shopping-lists/${activeListId}/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const activeList = lists.find(l => l._id === activeListId);
      if (activeList) {
        const updatedItems = activeList.items.filter(item => item._id !== itemId);
        setLists(lists.map(l => 
          l._id === activeListId ? { ...l, items: updatedItems } : l
        ));
      }
    } catch (error) {
      console.error('Erreur suppression article:', error);
    }
  };

  const exportToPDF = () => {
    if (!isPremium) {
      navigate('/premium');
      return;
    }

    const activeList = lists.find(l => l._id === activeListId);
    if (!activeList) return;

    const text = activeList.items
      .map(item => `${item.checked ? '☑' : '☐'} ${item.name} - ${item.quantity} ${item.unit}`)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeList.name}.txt`;
    a.click();
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const activeList = lists.find(l => l._id === activeListId);

  const itemsByCategory = activeList?.items.reduce((acc, item) => {
    const category = item.category || 'autres';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>) || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3FBEA] to-[#E9F8DF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4F1C0] border-t-[#7DDE4A] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6B6B]">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3FBEA] to-[#E9F8DF] pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 border border-[#DDE9DA]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-[#2E7DD7]" />
              <div>
                <h1 className="text-2xl font-bold text-[#232323]">Mes Courses</h1>
                <p className="text-sm text-[#6B6B6B]">
                  {lists.length} liste{lists.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/scan')}
              className="px-4 py-2 bg-[#7DDE4A] text-[#0E1A0D] rounded-[16px] font-semibold hover:bg-[#5FC72F] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Scanner
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {lists.map(list => (
              <button
                key={list._id}
                onClick={() => setActiveListId(list._id)}
                className={`px-4 py-2 rounded-[14px] font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeListId === list._id
                    ? 'bg-[#E9F8DF] text-[#236D3E] border border-[#D4F1C0]'
                    : 'bg-[#F7F9F4] text-[#6B6B6B] hover:bg-[#EDF2EA]'
                }`}
              >
                {list.name}
                {list.shared && <Share2 className="w-3 h-3" />}
              </button>
            ))}
            
            <button
              onClick={() => setShowNewListForm(true)}
              className="px-4 py-2 bg-[#F7F9F4] text-[#6B6B6B] rounded-[14px] font-medium hover:bg-[#EDF2EA] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle liste
            </button>
          </div>

          {showNewListForm && (
            <div className="mt-4 p-4 bg-[#EFF6FF] rounded-[14px] border border-[#BFDBFE]">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Nom de la liste"
                className="w-full px-4 py-2 border border-[#DDE9DA] rounded-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-[#236D3E]"
                onKeyPress={(e) => e.key === 'Enter' && createList()}
              />
              <div className="flex gap-2">
                <button
                  onClick={createList}
                  className="px-4 py-2 bg-[#2E7DD7] text-white rounded-[14px] font-semibold hover:bg-[#1D4ED8]"
                >
                  Creer
                </button>
                <button
                  onClick={() => setShowNewListForm(false)}
                  className="px-4 py-2 bg-[#EDF2EA] text-[#3B3B3B] rounded-[14px] font-semibold hover:bg-[#DDE9DA]"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {activeList ? (
          <>
            <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 border border-[#DDE9DA]">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowNewItemForm(true)}
                  className="flex-1 min-w-[200px] px-4 py-3 bg-[#7DDE4A] text-[#0E1A0D] rounded-[16px] font-semibold hover:bg-[#5FC72F] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter article
                </button>
                
                <button
                  onClick={exportToPDF}
                  className={`px-4 py-3 rounded-[16px] font-semibold transition-all flex items-center gap-2 ${
                    isPremium
                      ? 'bg-[#EFF6FF] text-[#2E7DD7] hover:bg-[#DBEAFE]'
                      : 'bg-[#F7F9F4] text-[#6B6B6B]'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  {isPremium ? 'Exporter' : <Crown className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => deleteList(activeList._id)}
                  className="px-4 py-3 bg-[#FEF3F3] text-[#D04343] rounded-[16px] font-semibold hover:bg-[#FECACA] transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showNewItemForm && (
              <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 border border-[#D4F1C0]">
                <h3 className="text-lg font-bold text-[#232323] mb-4">Nouvel article</h3>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newItem.name || ''}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Nom de l'article"
                    className="w-full px-4 py-3 border border-[#DDE9DA] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#236D3E]"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={newItem.quantity || 1}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                      placeholder="Quantite"
                      min="1"
                      className="px-4 py-3 border border-[#DDE9DA] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#236D3E]"
                    />
                    
                    <select
                      value={newItem.unit || 'unite'}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="px-4 py-3 border border-[#DDE9DA] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#236D3E]"
                    >
                      <option value="unite">unite(s)</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="mL">mL</option>
                      <option value="sachet">sachet(s)</option>
                      <option value="paquet">paquet(s)</option>
                    </select>
                  </div>
                  
                  <select
                    value={newItem.category || 'autres'}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-4 py-3 border border-[#DDE9DA] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#236D3E]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={addItem}
                      className="flex-1 px-4 py-3 bg-[#1B9E4B] text-white rounded-[14px] font-semibold hover:bg-[#178A3E]"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => setShowNewItemForm(false)}
                      className="px-4 py-3 bg-[#EDF2EA] text-[#3B3B3B] rounded-[14px] font-semibold hover:bg-[#DDE9DA]"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {CATEGORIES.filter(cat => itemsByCategory[cat.id]?.length > 0).map(category => {
                const items = itemsByCategory[category.id] || [];
                const isExpanded = expandedCategories.includes(category.id);
                const checkedCount = items.filter(i => i.checked).length;

                return (
                  <div key={category.id} className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-[#DDE9DA] overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F7F9F4] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div className="text-left">
                          <h3 className="font-semibold text-[#232323]">{category.label}</h3>
                          <p className="text-xs text-[#6B6B6B]">
                            {checkedCount}/{items.length} coche{items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-4 space-y-2">
                        {items.map(item => (
                          <div
                            key={item._id}
                            className={`flex items-center gap-3 p-3 rounded-[14px] border transition-all ${
                              item.checked 
                                ? 'bg-[#F7F9F4] border-[#EDF2EA]' 
                                : 'bg-white border-[#DDE9DA] hover:border-[#D4F1C0]'
                            }`}
                          >
                            <button
                              onClick={() => toggleItemCheck(item._id!)}
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                item.checked
                                  ? 'bg-[#1B9E4B] border-[#1B9E4B]'
                                  : 'border-[#DDE9DA] hover:border-[#1B9E4B]'
                              }`}
                            >
                              {item.checked && <Check className="w-4 h-4 text-white" />}
                            </button>

                            <div className={`flex-1 ${item.checked ? 'line-through text-[#6B6B6B]' : 'text-[#232323]'}`}>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-[#6B6B6B]">
                                {item.quantity} {item.unit}
                              </div>
                            </div>

                            {item.score && (
                              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.score >= 80 ? 'bg-[#F3FBF5] text-[#1B9E4B]' :
                                item.score >= 60 ? 'bg-[#FFF8E6] text-[#E9A100]' :
                                'bg-[#FEF3F3] text-[#D04343]'
                              }`}>
                                {item.score}/100
                              </div>
                            )}

                            <button
                              onClick={() => deleteItem(item._id!)}
                              className="p-2 text-[#D04343] hover:bg-[#FEF3F3] rounded-[14px] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 border border-[#DDE9DA]">
              <h3 className="text-lg font-bold text-[#232323] mb-4">Statistiques</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#2E7DD7]">{activeList.items.length}</div>
                  <div className="text-sm text-[#6B6B6B]">Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#1B9E4B]">
                    {activeList.items.filter(i => i.checked).length}
                  </div>
                  <div className="text-sm text-[#6B6B6B]">Coches</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#236D3E]">
                    {Object.keys(itemsByCategory).length}
                  </div>
                  <div className="text-sm text-[#6B6B6B]">Rayons</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#E9A100]">
                    {Math.round((activeList.items.filter(i => i.checked).length / activeList.items.length) * 100) || 0}%
                  </div>
                  <div className="text-sm text-[#6B6B6B]">Complete</div>
                </div>
              </div>
            </div>

          </>
        ) : (
          <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-12 text-center border border-[#DDE9DA]">
            <Package className="w-16 h-16 text-[#DDE9DA] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#232323] mb-2">Aucune liste</h3>
            <p className="text-[#6B6B6B] mb-6">Creez votre premiere liste de courses</p>
            <button
              onClick={() => setShowNewListForm(true)}
              className="px-6 py-3 bg-[#7DDE4A] text-[#0E1A0D] rounded-[16px] font-semibold hover:bg-[#5FC72F] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
            >
              Creer ma premiere liste
            </button>
          </div>
        )}

        {!isPremium && activeList && activeList.items.length >= 15 && (
          <div className="bg-[#FFF8E6] border border-[#FFE8A8] rounded-[16px] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#E9A100] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#6B4D00]">
                <strong>Limite gratuite:</strong> {activeList.items.length}/20 articles. 
                Passez Premium pour listes illimitees et export PDF.
                <button
                  onClick={() => navigate('/premium')}
                  className="ml-2 text-[#236D3E] font-semibold underline"
                >
                  Decouvrir Premium
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ShoppingListPage;