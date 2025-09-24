-- Inserir clusters fictícios
INSERT INTO public.clusters (name, is_active) VALUES 
('picpay-teste', true),
('picpay-devops', true)
ON CONFLICT (name) DO NOTHING;

-- Inserir usuários fictícios no perfil (apenas se não existirem)
DO $$
DECLARE
    cluster_teste_id uuid;
    cluster_devops_id uuid;
    run_teste_id uuid;
    run_devops_id uuid;
BEGIN
    -- Pegar IDs dos clusters
    SELECT id INTO cluster_teste_id FROM public.clusters WHERE name = 'picpay-teste';
    SELECT id INTO cluster_devops_id FROM public.clusters WHERE name = 'picpay-devops';
    
    -- Inserir runs fictícios
    INSERT INTO public.runs (cluster_id, run_ts, region, resource_created_days, resource_unused_days, created_count, unused_count, succeeded) VALUES
    (cluster_teste_id, NOW() - INTERVAL '1 day', 'us-east-1', 7, 30, 15, 8, true),
    (cluster_teste_id, NOW() - INTERVAL '2 days', 'us-east-1', 7, 30, 12, 5, true),
    (cluster_devops_id, NOW() - INTERVAL '1 day', 'us-west-2', 7, 30, 25, 12, true),
    (cluster_devops_id, NOW() - INTERVAL '3 days', 'us-west-2', 7, 30, 18, 9, true);

    -- Pegar run IDs para inserir recursos
    SELECT id INTO run_teste_id FROM public.runs WHERE cluster_id = cluster_teste_id LIMIT 1;
    SELECT id INTO run_devops_id FROM public.runs WHERE cluster_id = cluster_devops_id LIMIT 1;

    -- Inserir recursos criados fictícios
    INSERT INTO public.resources_created (cluster_id, run_id, name, type, account_name, console_link, manage_status, created_at, raw) VALUES 
    (cluster_teste_id, run_teste_id, 'ec2-instance-web-001', 'EC2', 'picpay-test-account', 'https://console.aws.amazon.com/ec2/v2/home', 'active', NOW() - INTERVAL '1 day', '{"InstanceId": "i-1234567890abcdef0", "InstanceType": "t3.medium", "State": "running"}'),
    (cluster_teste_id, run_teste_id, 'ec2-instance-api-001', 'EC2', 'picpay-test-account', 'https://console.aws.amazon.com/ec2/v2/home', 'active', NOW() - INTERVAL '2 hours', '{"InstanceId": "i-abcdef1234567890", "InstanceType": "t3.large", "State": "running"}'),
    (cluster_devops_id, run_devops_id, 'rds-database-prod', 'RDS', 'picpay-devops-account', 'https://console.aws.amazon.com/rds/home', 'active', NOW() - INTERVAL '1 day', '{"DBInstanceIdentifier": "prod-db", "DBInstanceClass": "db.t3.large", "Engine": "mysql"}'),
    (cluster_devops_id, run_devops_id, 'lambda-payment-processor', 'Lambda', 'picpay-devops-account', 'https://console.aws.amazon.com/lambda/home', 'active', NOW() - INTERVAL '3 hours', '{"FunctionName": "payment-processor", "Runtime": "python3.9"}');

    -- Inserir recursos não utilizados fictícios
    INSERT INTO public.resources_unused (cluster_id, run_id, name, type, resource_id, account_name, console_link, status, days_without_use, raw, metrics) VALUES
    (cluster_teste_id, run_teste_id, 'old-lambda-function', 'Lambda', 'lambda-12345', 'picpay-test-account', 'https://console.aws.amazon.com/lambda/home', 'unused', 45, '{"FunctionName": "old-lambda-function", "Runtime": "nodejs16.x"}', '{"invocations": 0, "duration": 0}'),
    (cluster_teste_id, run_teste_id, 'unused-ebs-volume', 'EBS', 'vol-0123456789abcdef0', 'picpay-test-account', 'https://console.aws.amazon.com/ec2/v2/home#Volumes', 'unused', 30, '{"VolumeId": "vol-0123456789abcdef0", "Size": 100, "VolumeType": "gp3"}', '{"iops": 0, "throughput": 0}'),
    (cluster_devops_id, run_devops_id, 'unused-s3-bucket', 'S3', 's3-bucket-unused', 'picpay-devops-account', 'https://console.aws.amazon.com/s3/home', 'unused', 60, '{"BucketName": "unused-s3-bucket", "Region": "us-west-2"}', '{"requests": 0, "storage": "1GB"}'),
    (cluster_devops_id, run_devops_id, 'old-load-balancer', 'ELB', 'elb-old-12345', 'picpay-devops-account', 'https://console.aws.amazon.com/ec2/v2/home#LoadBalancers', 'unused', 90, '{"LoadBalancerName": "old-load-balancer", "Type": "application"}', '{"requests": 0, "connections": 0}');
END $$;