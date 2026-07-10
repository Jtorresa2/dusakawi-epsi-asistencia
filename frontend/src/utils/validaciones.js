export function esVacio(valor) {
  return valor === null ||
         valor === undefined ||
         valor.toString().trim() === "";
}

export function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export function soloNumeros(valor) {
  return /^\d+$/.test(valor);
}

export function longitudMinima(valor, minimo) {
  return valor.trim().length >= minimo;
}