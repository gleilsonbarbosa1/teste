const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

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