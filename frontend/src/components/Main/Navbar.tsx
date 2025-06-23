import { Link } from 'react-router-dom'
import { ShoppingBag, User, LogOut, Settings, Heart, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../context/FavoritesContext'
import { Button } from '../ui/Button'
import { Cart } from './Cart'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const MainNavbar = () => {
  const { user, isAdmin } = useAuth()
  const { favoriteIds } = useFavorites()
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/home" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <ShoppingBag className="h-6 w-6" />
          TRC
        </Link>
        
        <nav className="hidden gap-8 md:flex">
          <Link to="/home" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Главная
          </Link>
          <Link to="/items" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Каталог
          </Link>
          <Link to="/outfits" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Образы
          </Link>
          {isAdmin && (
            <Link to="/admin/users" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Админ
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/favorites">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className={`h-5 w-5 ${favoriteIds.length > 0 ? 'fill-primary text-primary' : ''}`} />
            </Button>
          </Link>
          
          <Cart />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.first_name || user?.email} />
                  <AvatarFallback>
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.first_name && (
                    <p className="font-medium">{user.first_name}</p>
                  )}
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Профиль
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Настройки
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/history" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  История
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/logout" className="flex items-center gap-2 text-red-600">
                  <LogOut className="h-4 w-4" />
                  Выйти
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default MainNavbar