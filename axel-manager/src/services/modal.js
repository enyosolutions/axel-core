export function openModal(id) {
  document.getElementById('backdrop').style.display = 'block';
  document.getElementById(id).style.display = 'block';
  document.getElementById(id).classList.add('show');
  document.body.classList.add('modal-open');
  document.getElementById(id).setAttribute('data-modal', id);
}
export function closeModal(id) {
  document.getElementById('backdrop').style.display = 'none';
  document.body.classList.remove('modal-open');
  document.getElementById(id).style.display = 'none';
  document.getElementById(id).classList.remove('show');
  document.getElementById(id).removeAttribute('data-modal', id);
}

window.onclick = (event) => {
  if (event && event.target.hasAttribute('data-modal')) {
    closeModal(event.target.getAttribute('data-modal'));
  }
};
