const API_BASE = "http://localhost:5133";

export const getRateMatrices = async (projectId: string) => {
  const res = await fetch(`${API_BASE}/ratematrix?projectId=${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch rate matrices');
  return res.json();
};

export const createRateMatrices = async (matrices: any[]) => {
  const res = await fetch(`${API_BASE}/ratematrix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matrices),
  });
  if (!res.ok) throw new Error('Failed to create rate matrices');
  return res.json();
};

export const updateRateMatrix = async (id: number, matrix: any) => {
  const res = await fetch(`${API_BASE}/ratematrix/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matrix),
  });
  if (!res.ok) throw new Error('Failed to update rate matrix');
  return res.json();
};

export const deleteRateMatrix = async (id: number) => {
  const res = await fetch(`${API_BASE}/ratematrix/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete rate matrix');
  return res.json();
}; 