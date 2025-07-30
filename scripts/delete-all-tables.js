import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://afceshaeqqmbrtudlhwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmY2VzaGFlcXFtYnJ0dWRsaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODU3MTEsImV4cCI6MjA2MDI2MTcxMX0.-d9660Q-9wg89z0roOw4-czkWxq2fxdKOJX9SilKz2U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllTables() {
  try {
    console.log('🗑️ Iniciando exclusão de todas as mesas...');
    
    // Excluir todas as mesas da Loja 1
    console.log('🏪 Excluindo mesas da Loja 1...');
    const { error: store1Error } = await supabase
      .from('store1_tables')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (usando neq com ID impossível)
    
    if (store1Error) {
      console.error('❌ Erro ao excluir mesas da Loja 1:', store1Error);
    } else {
      console.log('✅ Todas as mesas da Loja 1 foram excluídas');
    }
    
    // Excluir todas as mesas da Loja 2
    console.log('🏪 Excluindo mesas da Loja 2...');
    const { error: store2Error } = await supabase
      .from('store2_tables')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (usando neq com ID impossível)
    
    if (store2Error) {
      console.error('❌ Erro ao excluir mesas da Loja 2:', store2Error);
    } else {
      console.log('✅ Todas as mesas da Loja 2 foram excluídas');
    }
    
    console.log('🎉 Processo de exclusão concluído!');
    console.log('📝 Você pode agora criar novas mesas sem conflitos');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar a função
deleteAllTables();