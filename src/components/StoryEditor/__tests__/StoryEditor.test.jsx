import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { StoriesContext } from '../../contexts/StoriesContext';
import StoryEditor from './StoryEditor';

// Mock do useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-story-id' }),
    useNavigate: () => vi.fn()
  };
});

describe('StoryEditor Component', () => {
  const mockStory = {
    id: 'test-story-id',
    title: 'Test Story',
    description: 'Test Description',
    slides: [
      { type: 'image', content: 'data:image/png;base64,test', caption: 'Test Caption' }
    ],
    isPublic: true,
    tags: ['test', 'story']
  };

  const mockStoriesContext = {
    stories: [mockStory],
    fetchStory: vi.fn().mockResolvedValue(mockStory),
    createStory: vi.fn().mockResolvedValue({ id: 'new-story-id' }),
    updateStory: vi.fn().mockResolvedValue(mockStory),
    deleteStory: vi.fn().mockResolvedValue(true)
  };

  const mockAuthContext = {
    user: {
      id: '123',
      name: 'Test User'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor with story data when editing existing story', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StoriesContext.Provider value={mockStoriesContext}>
            <StoryEditor />
          </StoriesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se está carregando inicialmente
    expect(screen.getByText(/Carregando editor/i)).toBeInTheDocument();

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(mockStoriesContext.fetchStory).toHaveBeenCalledWith('test-story-id');
    });

    // Verificar se os dados do story foram carregados
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Story')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    });
  });

  it('handles title and description changes', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StoriesContext.Provider value={mockStoriesContext}>
            <StoryEditor />
          </StoriesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando editor/i)).not.toBeInTheDocument();
    });

    // Alterar título
    const titleInput = screen.getByLabelText(/Título/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    expect(titleInput.value).toBe('Updated Title');

    // Alterar descrição
    const descriptionInput = screen.getByLabelText(/Descrição/i);
    fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
    expect(descriptionInput.value).toBe('Updated Description');
  });

  it('toggles between edit and preview modes', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StoriesContext.Provider value={mockStoriesContext}>
            <StoryEditor />
          </StoriesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando editor/i)).not.toBeInTheDocument();
    });

    // Verificar se está no modo de edição inicialmente
    expect(screen.getByText(/Visualizar/i)).toBeInTheDocument();

    // Clicar no botão de visualização
    fireEvent.click(screen.getByText(/Visualizar/i));

    // Verificar se mudou para o modo de visualização
    await waitFor(() => {
      expect(screen.getByText(/Editar/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Story/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Description/i)).toBeInTheDocument();
    });

    // Voltar para o modo de edição
    fireEvent.click(screen.getByText(/Editar/i));

    // Verificar se voltou para o modo de edição
    await waitFor(() => {
      expect(screen.getByText(/Visualizar/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
    });
  });

  it('saves story changes', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StoriesContext.Provider value={mockStoriesContext}>
            <StoryEditor />
          </StoriesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando editor/i)).not.toBeInTheDocument();
    });

    // Alterar título
    const titleInput = screen.getByLabelText(/Título/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    // Clicar no botão de salvar
    fireEvent.click(screen.getByText(/Salvar/i));

    // Verificar se a função de atualização foi chamada
    await waitFor(() => {
      expect(mockStoriesContext.updateStory).toHaveBeenCalledWith(
        'test-story-id',
        expect.objectContaining({
          title: 'Updated Title'
        })
      );
    });
  });

  it('adds and removes slides', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StoriesContext.Provider value={mockStoriesContext}>
            <StoryEditor />
          </StoriesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando editor/i)).not.toBeInTheDocument();
    });

    // Verificar se há um slide inicialmente
    expect(screen.getByText(/Slide 1/i)).toBeInTheDocument();

    // Adicionar um novo slide
    fireEvent.click(screen.getByText(/Adicionar Slide/i));

    // Verificar se o novo slide foi adicionado
    expect(screen.getByText(/Slide 2/i)).toBeInTheDocument();

    // Excluir o slide atual
    fireEvent.click(screen.getByText(/Excluir Slide/i));

    // Verificar se voltou para o slide 1
    expect(screen.getByText(/Slide 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Slide 2/i)).not.toBeInTheDocument();
  });

  it('handles slide type changes', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StoriesContext.Provider value={mockStoriesContext}>
            <StoryEditor />
          </StoriesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando editor/i)).not.toBeInTheDocument();
    });

    // Verificar se o tipo inicial é imagem
    expect(screen.getByText(/Imagem/i)).toHaveClass('active');

    // Mudar para tipo texto
    fireEvent.click(screen.getByText(/Texto/i));

    // Verificar se o tipo mudou para texto
    expect(screen.getByText(/Texto/i)).toHaveClass('active');
    expect(screen.getByText(/Imagem/i)).not.toHaveClass('active');

    // Verificar se o editor de texto está visível
    expect(screen.getByPlaceholderText(/Digite o texto do slide/i)).toBeInTheDocument();
  });

  it('handles tag management', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StoriesContext.Provider value={mockStoriesContext}>
            <StoryEditor />
          </StoriesContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Esperar pelo carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando editor/i)).not.toBeInTheDocument();
    });

    // Verificar se as tags existentes estão presentes
    expect(screen.getByText(/test/i)).toBeInTheDocument();
    expect(screen.getByText(/story/i)).toBeInTheDocument();

    // Adicionar uma nova tag
    const tagInput = screen.getByPlaceholderText(/Adicionar tag/i);
    fireEvent.change(tagInput, { target: { value: 'new-tag' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar tag/i }));

    // Verificar se a nova tag foi adicionada
    expect(screen.getByText(/new-tag/i)).toBeInTheDocument();

    // Remover uma tag
    const removeButtons = screen.getAllByRole('button', { name: /Remover tag/i });
    fireEvent.click(removeButtons[0]); // Remover a primeira tag

    // Verificar se a tag foi removida
    expect(screen.queryByText(/test/i)).not.toBeInTheDocument();
  });
});
