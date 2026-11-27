import {Outlet} from 'react-router-dom';

export default function Layout() {
    return(
        <div className="app-layout">
            <header className='app-header'>OfficeMart Admin</header>
            <main className='app-main'>
                <Outlet />
            </main>
        </div>
    );
}