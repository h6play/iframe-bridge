import './style.css'
import IndexPage from './pages/index';
import Node1Page from './pages/node1';
import Node1$1Page from './pages/node1-1';
import Node2Page from './pages/node2';
import Node2$1Page from './pages/node2-1';

const Routes = {
  '/': IndexPage,
  '/node1': Node1Page,
  '/node1-1': Node1$1Page,
  '/node2': Node2Page,
  '/node2-1': Node2$1Page,
};

const path = (() => {
  const strs = window.location.href.split('#');
  if (strs[1] && Object.keys(Routes).includes(strs[1])) {
    return strs[1];
  } else {
    return '/';
  }
})();

Object.entries(Routes).forEach(([route, Component]) => {
  if (path === route) {
    document.querySelector('#app')!.innerHTML = `${Component.template()}<style>${Component.style()}</style>`;
    setTimeout(() => Component.script(), 0);
  }
});